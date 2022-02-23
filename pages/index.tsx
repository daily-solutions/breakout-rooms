import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import {
  GridViewIcon,
  SmallCrossIcon,
  LogOutIcon,
  SettingsIcon,
  TimeIcon,
  Popover,
  Position,
  Menu,
  CornerDialog,
  Button,
} from 'evergreen-ui';
import { io } from 'socket.io-client';
import Head from 'next/head';
import BreakoutModal from '../components/BreakoutModal';
import Timer from '../components/Timer';
import useBreakoutRoom from '../components/useBreakoutRoom';
import ManageBreakoutRooms from '../components/ManageBreakoutRooms';
import styles from '../styles/Home.module.css';

const CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '100vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

const BREAKOUT_CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '96vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

const Room = () => {
  const callRef = useRef<HTMLDivElement>(null);

  const [show, setShow] = useState(false);
  const [warn, setWarn] = useState(false);
  const [manage, setManage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [breakoutModal, setBreakoutModal] = useState(false);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);

  const { endSession } = useBreakoutRoom();

  const [breakoutSession, setBreakoutSession] = useState<any>(null);

  const joinCall = useCallback(
    (name = process.env.NEXT_PUBLIC_DAILY_ROOM, token = '', breakout = false) => {
      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as HTMLElement,
        breakout ? BREAKOUT_CALL_OPTIONS : CALL_OPTIONS,
      );

      newCallFrame.setTheme({
        colors: {
          accent: '#286DA8',
          accentText: '#FFFFFF',
          background: '#FFFFFF',
          backgroundAccent: '#FBFCFD',
          baseText: '#000000',
          border: '#EBEFF4',
          mainAreaBg: '#000000',
          mainAreaBgAccent: '#071D3A',
          mainAreaText: '#FFFFFF',
          supportiveText: '#808080',
        },
      });

      setCallFrame(newCallFrame as DailyCall);
      if (breakout) {
        newCallFrame.join({ url: `https://harshith.daily.co/${name}`, token });
        setWarn(true);
      } else {
        newCallFrame
          .join({ url: `https://harshith.daily.co/${name}`, token })
          .then(() => {
            localStorage.setItem(
              'main-breakout-user-id',
              newCallFrame.participants().local.user_id,
            );
          });
      }

      const leave = async () => {
        callFrame?.destroy();
        setShow(false);
        setCallFrame(null);
      };

      newCallFrame.on('joined-meeting', () => setShow(true));
      newCallFrame.on('left-meeting', leave);
      return () => {
        newCallFrame.off('joined-meeting', () => setShow(true));
        newCallFrame.off('left-meeting', leave);
      };
    },
    [callFrame],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: any) => {
      if (!callFrame) return;

      const localUser = await callFrame.participants().local;
      setBreakoutSession(data.sessionObject);
      data.sessionObject.rooms?.map(async (room: any) => {
        if (room.participants.includes(localUser.user_id)) {
          const options = {
            method: 'POST',
            body: JSON.stringify({
              roomName: room.room_url,
              isOwner,
              username: localUser.user_name,
              recordBreakoutRooms:
                data.sessionObject.config.record_breakout_sessions,
            }),
          };

          const res = await fetch('/api/token', options);
          const { token } = await res.json();
          await callFrame.destroy();
          joinCall(room.room_url, token, true);
        }
      });
    },
    [callFrame, isOwner, joinCall],
  );

  const joinAs = useCallback(async (owner: boolean = false) => {
    if (owner) {
      const options = {
        method: 'POST',
        body: JSON.stringify({ is_owner: owner }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      setIsOwner(true);
      joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM, token);
    } else joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM);
  }, [joinCall]);

  useEffect((): any => {
    const socket = io({ path: '/api/socketio' });

    socket.on('connect', () => {
      console.log('SOCKET CONNECTED!', socket.id);
    });

    socket.on('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    socket.on('DAILY_BREAKOUT_UPDATED', (data: any) =>
      setBreakoutSession(data),
    );
    socket.on('DAILY_BREAKOUT_CONCLUDED', () => {
      setBreakoutSession(null);
      setWarn(false);
      callFrame?.destroy();
      setCallFrame(null);
      joinAs(isOwner)
    });
    if (socket) return () => socket.disconnect();
  }, [callFrame, handleBreakoutSessionStarted, isOwner, joinAs]);

  const myBreakoutRoom = useMemo(() => {
    if (breakoutSession) {
      const localUserId = localStorage.getItem('main-breakout-user-id');
      // @ts-ignore
      return breakoutSession.rooms.filter((room: any) =>
        room.participants.includes(localUserId),
      )[0];
    }
  }, [breakoutSession]);

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>
      {callFrame && breakoutSession && (
        <div className="banner">
          <b>{myBreakoutRoom.name}</b>
          {breakoutSession.config.exp && (
            <span className="text-right">
              <Timer expiry={breakoutSession.config.exp} />
            </span>
          )}
        </div>
      )}
      {!callFrame && (
        <div className={styles.container}>
          <Head>
            <title>Breakout Rooms</title>
            <meta name="description" content="Breakout Rooms" />
          </Head>

          <main className={styles.main}>
            <h1 className={styles.title}>
              Welcome to <span>Breakout Rooms!</span>
            </h1>

            <p className={styles.description}>Get started by joining a room!</p>

            <div className={styles.join}>
              <Button
                appearance="primary"
                marginRight={16}
                onClick={() => joinAs(true)}
              >
                Join as owner
              </Button>
              <Button onClick={() => joinAs()}>Join as participant</Button>
            </div>
          </main>
        </div>
      )}
      <div ref={callRef} className="room" />
      {show && (
        <>
          {!breakoutSession ? (
            <button
              type="button"
              className="breakout-button"
              onClick={() => setBreakoutModal(true)}
            >
              <GridViewIcon marginBottom={5} />
              Breakout
            </button>
          ) : (
            <Popover
              content={
                <Menu>
                  <Menu.Group>
                    {breakoutSession.config.exp && (
                      <Menu.Item disabled icon={TimeIcon}>
                        Time left: <Timer expiry={breakoutSession.config.exp} />
                      </Menu.Item>
                    )}
                    {isOwner && (
                      <Menu.Item
                        icon={SettingsIcon}
                        onSelect={() => setManage(!manage)}
                      >
                        Manage rooms
                      </Menu.Item>
                    )}
                    {breakoutSession.config.allow_user_exit && (
                      <Menu.Item
                        icon={LogOutIcon}
                        onSelect={() => {
                          callFrame?.destroy();
                          setCallFrame(null);
                          setBreakoutSession(null);
                          joinAs(isOwner);
                        }}
                      >
                        Return to lobby
                      </Menu.Item>
                    )}
                  </Menu.Group>
                  {isOwner && (
                    <>
                      <Menu.Divider />
                      <Menu.Group>
                        <Menu.Item
                          icon={SmallCrossIcon}
                          intent="danger"
                          onSelect={endSession}
                        >
                          End breakout session
                        </Menu.Item>
                      </Menu.Group>
                    </>
                  )}
                </Menu>
              }
              position={Position.TOP_RIGHT}
            >
              <button type="button" className="breakout-button">
                <GridViewIcon marginBottom={5} />
                Breakout
              </button>
            </Popover>
          )}
        </>
      )}
      <BreakoutModal
        show={breakoutModal}
        setShow={setBreakoutModal}
        call={callFrame as DailyCall}
      />
      <CornerDialog
        title="Muted video & audio"
        isShown={warn}
        onCloseComplete={() => setWarn(false)}
        confirmLabel="Okay"
        onConfirm={() => setWarn(false)}
        hasCancel={false}
      >
        Video and audio are muted by default on joining the breakout rooms for
        the sake of privacy, you can always turn them on!
      </CornerDialog>
      {manage && (
        <ManageBreakoutRooms
          isShown={manage}
          setShown={setManage}
          breakoutSession={breakoutSession}
          call={callFrame as DailyCall}
        />
      )}
      <style jsx>{`
        .banner {
          text-align: center;
          height: 4vh;
          padding: 0.5rem;
          background: #eee;
        }
        .breakout-button {
          z-index: 10;
          position: fixed;
          bottom: 0.5em;
          right: 5em;
          background-color: transparent;
          color: #000000;
          border: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          font-size: 12px;
          font-weight: normal;
          line-height: 16px;
          margin: 0;
          text-align: inherit;
        }
        .text-right {
          float: right;
        }
      `}</style>
    </div>
  );
};

export default Room;
