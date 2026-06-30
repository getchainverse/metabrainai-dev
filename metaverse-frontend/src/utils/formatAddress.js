export const formatAddress = (address, chars = 4) => {
  if (!address || address.length < chars * 2 + 2) return address || "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};
