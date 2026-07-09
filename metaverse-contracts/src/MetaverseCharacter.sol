// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MetaverseCharacter
 * @author Sanjaya Subedi
 * @notice ERC-721 collection where every token is a chattable 3D character in the metaverse.
 *         Each character binds two off-chain resources on-chain:
 *           - `modelURI`   : the 3D asset (e.g. a glTF/GLB model) rendered in virtual worlds.
 *           - `personaURI` : the AI persona / knowledge-base reference that drives the
 *                            character's conversational behaviour (the "brain").
 *
 * @dev Design highlights:
 *      - Signature-based lazy minting (EIP-712 vouchers) so the platform's backend can authorise
 *        a specific character + price off-chain while the buyer pays gas on redemption. Vouchers
 *        are single-use (nonce) and time-bounded (deadline) to prevent replay.
 *      - ERC-2981 royalties for secondary-market compatibility.
 *      - Role-based access control instead of a single owner, so minting, persona management and
 *        administration can be delegated to separate operational keys.
 *      - Pausable transfers as a circuit breaker, and reentrancy-guarded value flows.
 *      - Owners can permanently freeze a character's URIs to guarantee immutability to buyers.
 */
contract MetaverseCharacter is ERC721, ERC2981, AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    /*//////////////////////////////////////////////////////////////
                                 ROLES
    //////////////////////////////////////////////////////////////*/

    /// @notice May mint characters directly (platform-curated drops).
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice Signs EIP-712 mint vouchers redeemable by end users.
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    /// @notice Updates a character's model/persona URIs while it is not frozen.
    bytes32 public constant PERSONA_MANAGER_ROLE = keccak256("PERSONA_MANAGER_ROLE");
    /// @notice May pause and unpause token transfers.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Immutable hard cap on the number of characters that can ever exist.
    uint256 public immutable maxSupply;

    /// @notice Maximum characters a single address may acquire through voucher redemption.
    uint256 public maxPerWallet;

    /// @dev Next token id to assign. Ids start at 1 so that 0 is an unambiguous "none".
    uint256 private _nextTokenId = 1;

    /// @notice Off-chain, collection-level metadata URI (OpenSea `contractURI` convention).
    string private _contractURI;

    /**
     * @notice On-chain description of a character.
     * @param name         Human-readable character name, fixed at mint time.
     * @param modelURI      Pointer to the 3D asset rendered in-world.
     * @param personaURI    Pointer to the AI persona / knowledge base driving conversation.
     * @param metadataURI   ERC-721 metadata JSON returned by {tokenURI}.
     * @param mintedAt      Block timestamp of mint (packs with `frozen` into one slot).
     * @param frozen        Once true, the URIs above can never change again.
     */
    struct Character {
        string name;
        string modelURI;
        string personaURI;
        string metadataURI;
        uint64 mintedAt;
        bool frozen;
    }

    /**
     * @notice Data supplied when a character is created.
     * @dev `personaURI` may be empty at mint and assigned later by a persona manager.
     */
    struct CharacterInput {
        string name;
        string modelURI;
        string personaURI;
        string metadataURI;
    }

    /**
     * @notice An off-chain authorisation to mint a specific character at a set price.
     * @param to           Recipient of the minted character.
     * @param character    The character to create.
     * @param price        Exact wei the redeemer must pay.
     * @param nonce        Unique per-voucher value; a voucher can be redeemed only once.
     * @param deadline     Unix timestamp after which the voucher is no longer valid.
     */
    struct MintVoucher {
        address to;
        CharacterInput character;
        uint256 price;
        uint256 nonce;
        uint256 deadline;
    }

    /// @notice tokenId => character record.
    mapping(uint256 => Character) private _characters;

    /// @notice Number of characters minted to an address via voucher redemption.
    mapping(address => uint256) public mintedCount;

    /// @notice Tracks consumed voucher nonces to prevent replay.
    mapping(uint256 => bool) public nonceUsed;

    /// @dev EIP-712 type hashes.
    bytes32 private constant CHARACTER_INPUT_TYPEHASH = keccak256(
        "CharacterInput(string name,string modelURI,string personaURI,string metadataURI)"
    );
    bytes32 private constant VOUCHER_TYPEHASH = keccak256(
        "MintVoucher(address to,CharacterInput character,uint256 price,uint256 nonce,uint256 deadline)CharacterInput(string name,string modelURI,string personaURI,string metadataURI)"
    );

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event CharacterMinted(uint256 indexed tokenId, address indexed to, string name);
    event VoucherRedeemed(
        uint256 indexed tokenId, address indexed to, uint256 nonce, uint256 price
    );
    event CharacterURIsUpdated(
        uint256 indexed tokenId, string modelURI, string personaURI, string metadataURI
    );
    event CharacterFrozen(uint256 indexed tokenId);
    event MaxPerWalletUpdated(uint256 previous, uint256 current);
    event ContractURIUpdated(string uri);
    event Withdrawn(address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error MaxSupplyReached();
    error MaxPerWalletReached();
    error VoucherExpired();
    error NonceAlreadyUsed();
    error UnauthorizedSigner(address signer);
    error IncorrectPayment(uint256 expected, uint256 provided);
    error CharacterIsFrozen();
    error NotCharacterOwner();
    error ZeroAddress();
    error EmptyRequiredURI();
    error InvalidMaxSupply();
    error WithdrawFailed();
    error NothingToWithdraw();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @param name_               ERC-721 collection name.
     * @param symbol_             ERC-721 collection symbol.
     * @param admin               Address granted every operational role initially.
     * @param maxSupply_          Immutable hard cap on total characters.
     * @param maxPerWallet_       Per-wallet cap for voucher redemptions.
     * @param royaltyReceiver     Default ERC-2981 royalty recipient.
     * @param royaltyFeeNumerator Royalty in basis points (e.g. 500 = 5%). Max 10000.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address admin,
        uint256 maxSupply_,
        uint256 maxPerWallet_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) ERC721(name_, symbol_) EIP712(name_, "1") {
        if (admin == address(0) || royaltyReceiver == address(0)) {
            revert ZeroAddress();
        }
        if (maxSupply_ == 0) revert InvalidMaxSupply();

        maxSupply = maxSupply_;
        maxPerWallet = maxPerWallet_;

        // ERC2981 validates that the fee numerator does not exceed the denominator.
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);

        // Bootstrap all roles to the admin; the platform can redistribute them afterwards.
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(SIGNER_ROLE, admin);
        _grantRole(PERSONA_MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /*//////////////////////////////////////////////////////////////
                                MINTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a platform-curated character to `to`. Does not count against the
     *         per-wallet cap and requires no payment.
     * @dev Restricted to {MINTER_ROLE}. Follows checks-effects-interactions: all state is
     *      written before {_safeMint} performs the external `onERC721Received` callback.
     */
    function adminMint(address to, CharacterInput calldata character)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
        returns (uint256 tokenId)
    {
        if (to == address(0)) revert ZeroAddress();
        tokenId = _createCharacter(to, character);
    }

    /**
     * @notice Redeem an EIP-712 voucher signed by a {SIGNER_ROLE} key to mint a character.
     * @dev The exact `price` must be supplied. Replay is prevented by consuming the voucher
     *      nonce; expiry is enforced via `deadline`. Effects precede the {_safeMint}
     *      interaction and the function is `nonReentrant`.
     * @param voucher   The signed authorisation.
     * @param signature The signer's EIP-712 signature over `voucher`.
     */
    function redeem(MintVoucher calldata voucher, bytes calldata signature)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        if (block.timestamp > voucher.deadline) revert VoucherExpired();
        if (nonceUsed[voucher.nonce]) revert NonceAlreadyUsed();
        if (msg.value != voucher.price) revert IncorrectPayment(voucher.price, msg.value);
        if (mintedCount[voucher.to] + 1 > maxPerWallet) revert MaxPerWalletReached();

        address signer = _recoverVoucherSigner(voucher, signature);
        if (!hasRole(SIGNER_ROLE, signer)) revert UnauthorizedSigner(signer);

        // Effects.
        nonceUsed[voucher.nonce] = true;
        unchecked {
            // Bounded by maxSupply; cannot overflow.
            ++mintedCount[voucher.to];
        }

        // Interaction (via _safeMint's receiver callback) happens last.
        tokenId = _createCharacter(voucher.to, voucher.character);

        emit VoucherRedeemed(tokenId, voucher.to, voucher.nonce, voucher.price);
    }

    /**
     * @dev Shared minting core: validates supply and required URIs, records the character,
     *      then mints. Assumes any per-path checks (roles, payment, caps) already passed.
     */
    function _createCharacter(address to, CharacterInput calldata character)
        private
        returns (uint256 tokenId)
    {
        if (bytes(character.modelURI).length == 0 || bytes(character.metadataURI).length == 0) {
            revert EmptyRequiredURI();
        }

        tokenId = _nextTokenId;
        if (tokenId > maxSupply) revert MaxSupplyReached();
        unchecked {
            _nextTokenId = tokenId + 1;
        }

        _characters[tokenId] = Character({
            name: character.name,
            modelURI: character.modelURI,
            personaURI: character.personaURI,
            metadataURI: character.metadataURI,
            mintedAt: uint64(block.timestamp),
            frozen: false
        });

        _safeMint(to, tokenId);
        emit CharacterMinted(tokenId, to, character.name);
    }

    /*//////////////////////////////////////////////////////////////
                          CHARACTER MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update the model/persona/metadata URIs of a character.
     * @dev Restricted to {PERSONA_MANAGER_ROLE}. Reverts once the character is frozen.
     *      The character name is intentionally immutable to preserve identity.
     */
    function updateCharacterURIs(
        uint256 tokenId,
        string calldata modelURI,
        string calldata personaURI,
        string calldata metadataURI
    ) external onlyRole(PERSONA_MANAGER_ROLE) {
        _requireOwned(tokenId);
        Character storage c = _characters[tokenId];
        if (c.frozen) revert CharacterIsFrozen();
        if (bytes(modelURI).length == 0 || bytes(metadataURI).length == 0) {
            revert EmptyRequiredURI();
        }

        c.modelURI = modelURI;
        c.personaURI = personaURI;
        c.metadataURI = metadataURI;

        emit CharacterURIsUpdated(tokenId, modelURI, personaURI, metadataURI);
    }

    /**
     * @notice Permanently freeze a character's URIs. Only the token owner may call this.
     * @dev Gives buyers a credible guarantee that the 3D model and AI persona cannot be
     *      altered after the fact. Irreversible.
     */
    function freezeCharacter(uint256 tokenId) external {
        if (ownerOf(tokenId) != msg.sender) revert NotCharacterOwner();
        _characters[tokenId].frozen = true;
        emit CharacterFrozen(tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                              ADMINISTRATION
    //////////////////////////////////////////////////////////////*/

    function setMaxPerWallet(uint256 newMax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit MaxPerWalletUpdated(maxPerWallet, newMax);
        maxPerWallet = newMax;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (receiver == address(0)) revert ZeroAddress();
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setContractURI(string calldata uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _contractURI = uri;
        emit ContractURIUpdated(uri);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Withdraw accumulated voucher proceeds to `to`.
     * @dev Admin-only and `nonReentrant`; uses a low-level call and checks its success.
     */
    function withdraw(address to) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert WithdrawFailed();

        emit Withdrawn(to, amount);
    }

    /*//////////////////////////////////////////////////////////////
                                 VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @notice Full on-chain record for a character.
    function getCharacter(uint256 tokenId) external view returns (Character memory) {
        _requireOwned(tokenId);
        return _characters[tokenId];
    }

    /// @notice Number of characters minted so far.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Remaining mintable supply.
    function remainingSupply() external view returns (uint256) {
        return maxSupply - (_nextTokenId - 1);
    }

    /// @notice Collection-level metadata URI (marketplace convention).
    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    /// @inheritdoc ERC721
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _characters[tokenId].metadataURI;
    }

    /**
     * @notice Compute the EIP-712 digest for a voucher, useful for off-chain signing/testing.
     */
    function hashVoucher(MintVoucher calldata voucher) external view returns (bytes32) {
        return _hashTypedDataV4(_voucherStructHash(voucher));
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL / OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function _recoverVoucherSigner(MintVoucher calldata voucher, bytes calldata signature)
        private
        view
        returns (address)
    {
        bytes32 digest = _hashTypedDataV4(_voucherStructHash(voucher));
        return digest.recover(signature);
    }

    function _voucherStructHash(MintVoucher calldata voucher) private pure returns (bytes32) {
        bytes32 characterHash = keccak256(
            abi.encode(
                CHARACTER_INPUT_TYPEHASH,
                keccak256(bytes(voucher.character.name)),
                keccak256(bytes(voucher.character.modelURI)),
                keccak256(bytes(voucher.character.personaURI)),
                keccak256(bytes(voucher.character.metadataURI))
            )
        );
        return keccak256(
            abi.encode(
                VOUCHER_TYPEHASH,
                voucher.to,
                characterHash,
                voucher.price,
                voucher.nonce,
                voucher.deadline
            )
        );
    }

    /**
     * @dev Routes all mints, transfers and burns through the pausable circuit breaker.
     *      Overrides {ERC721-_update}.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    /// @dev Resolves the multiple-inheritance diamond for {IERC165} support.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
