import { BrowserProvider, parseEther } from "ethers";
import { IoChevronUp, IoChevronDown, IoChevronBack, IoChevronForward } from "react-icons/io5";

const Button = ({ label, onPointerDown, onPointerUp, icon: Icon }) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerLeave={onPointerUp}
    className="grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-slate-950/40 text-white backdrop-blur-md"
  >
    <Icon className="h-5 w-5" />
  </button>
);

const WorldOverlay = ({
  connected,
  playerCount,
  players = {},
  selfId,
  voiceEnabled,
  voiceMuted,
  voiceError,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
}) => {
  const setKey = (code, value) => {
    const eventType = value ? "keydown" : "keyup";
    window.dispatchEvent(new KeyboardEvent(eventType, { code }));
  };

  const handleGiftEth = async (player) => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it to send money.");
      return;
    }
    if (!player.walletAddress) {
      alert("This player does not have a connected wallet address.");
      return;
    }
    const amount = prompt(`Enter ETH amount to send to ${player.username || "player"}:`, "0.001");
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: player.walletAddress,
        value: parseEther(amount),
      });
      alert(`Transaction sent successfully! Hash: ${tx.hash}`);
    } catch (err) {
      alert("Failed to send ETH: " + (err.message || err));
    }
  };

  const otherPlayers = Object.values(players).filter((p) => p.id !== selfId);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <div className="pointer-events-auto max-w-md rounded-2xl border border-white/30 bg-slate-950/35 p-4 text-white backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Metaverse World 01</p>
        <h1 className="mt-2 text-2xl font-semibold">A quiet first world to walk through</h1>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-cyan-100">
          {connected ? "Connected" : "Connecting"} {playerCount ? ` - ${playerCount} players` : ""}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-100">
          Use `WASD` or the mobile controls to move. Space jumps. Collision keeps the player from
          passing through world objects.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {!voiceEnabled ? (
            <>
              <button
                type="button"
                onClick={() => onJoinVoice(false)}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Join Voice
              </button>
              <button
                type="button"
                onClick={() => onJoinVoice(true)}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
              >
                Join Voice & Video
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleMute}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                {voiceMuted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={onLeaveVoice}
                className="rounded-full bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Leave Voice
              </button>
            </>
          )}
        </div>
        {voiceError && <p className="mt-3 text-sm text-rose-200">{voiceError}</p>}

        {otherPlayers.length > 0 && (
          <div className="mt-4 border-t border-white/20 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Nearby Players (Gifting)
            </p>
            <div className="mt-2 flex flex-col gap-2 max-h-32 overflow-y-auto">
              {otherPlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-4 text-sm bg-white/5 p-2 rounded">
                  <span>{player.username || "Guest"}</span>
                  <button
                    type="button"
                    onClick={() => handleGiftEth(player)}
                    className="rounded bg-teal-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-teal-400"
                  >
                    Gift ETH
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-auto flex items-end justify-between gap-4">
        <div className="grid gap-2">
          <div className="flex justify-center">
            <Button
              label="Move up"
              icon={IoChevronUp}
              onPointerDown={() => setKey("KeyW", true)}
              onPointerUp={() => setKey("KeyW", false)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              label="Move left"
              icon={IoChevronBack}
              onPointerDown={() => setKey("KeyA", true)}
              onPointerUp={() => setKey("KeyA", false)}
            />
            <Button
              label="Move down"
              icon={IoChevronDown}
              onPointerDown={() => setKey("KeyS", true)}
              onPointerUp={() => setKey("KeyS", false)}
            />
            <Button
              label="Move right"
              icon={IoChevronForward}
              onPointerDown={() => setKey("KeyD", true)}
              onPointerUp={() => setKey("KeyD", false)}
            />
          </div>
        </div>

        <button
          type="button"
          className="pointer-events-auto rounded-full border border-white/30 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg"
          onPointerDown={() => setKey("Space", true)}
          onPointerUp={() => setKey("Space", false)}
        >
          Jump
        </button>
      </div>
    </div>
  );
};

export default WorldOverlay;
