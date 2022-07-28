import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useCall } from '../../contexts/CallProvider';
import Hero from '../Hero';
import Banner from '../Banner';
import CreateBreakoutModal from '../Modals/CreateBreakoutModal';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import BreakoutMenu from '../Modals/BreakoutMenu';
import JoinBreakoutModal from '../Modals/JoinRoomModal';
import ManageBreakoutRooms from '../Modals/ManageBreakout';
import { CornerDialog, Pane, Spinner } from 'evergreen-ui';
import { useRouter } from 'next/router';

const Room = () => {
  const router = useRouter();
  const { room, owner, participant } = router.query;
  const { callRef, callFrame, joinAs, isInRoom } = useCall();
  const { breakoutSession, join, isBreakoutRoom, warn, setWarn } =
    useBreakoutRoom();

  const showingCall = useMemo(
    () => owner === 'true' || participant === 'true',
    [owner, participant],
  );

  useEffect(() => {
    const showCall = owner === 'true' || participant === 'true';
    if (!router.isReady || isInRoom || !showCall) return;

    joinAs(room as string, owner === 'true');
  }, [room, owner, router.isReady, participant, joinAs, isInRoom]);

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      {!callFrame ? (
        showingCall ? (
          <Pane
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="100vw"
            height="100vh"
          >
            <Spinner />
          </Pane>
        ) : (
          <Hero />
        )
      ) : (
        <Banner />
      )}

      <div
        ref={callRef}
        className="room"
        style={{ width: '100vw', height: isBreakoutRoom ? '96vh' : '100vh' }}
      />

      {callFrame && breakoutSession ? (
        <BreakoutMenu />
      ) : (
        <CreateBreakoutModal />
      )}
      {join && <JoinBreakoutModal />}
      {breakoutSession && isBreakoutRoom && <ManageBreakoutRooms />}

      <CornerDialog
        title="You are muted"
        isShown={warn}
        onCloseComplete={() => setWarn(false)}
        confirmLabel="Okay"
        onConfirm={() => setWarn(false)}
        hasCancel={false}
      >
        On joining a breakout session, your video and audio are muted by default
        - you can always unmute yourself.
      </CornerDialog>
    </div>
  );
};

export default Room;
