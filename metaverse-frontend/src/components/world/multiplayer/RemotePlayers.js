import React from "react";
import RemotePlayer from "./RemotePlayer";

const RemotePlayers = ({ players, selfId }) => {
  const remotePlayers = Object.values(players).filter((player) => player.id !== selfId);

  return (
    <>
      {remotePlayers.map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}
    </>
  );
};

export default RemotePlayers;
