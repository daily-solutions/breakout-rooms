import React, { useCallback, useEffect, useState } from 'react';
import {
  SideSheet,
  Pane,
  Heading,
  Card,
  Paragraph,
  Button,
  Text,
} from 'evergreen-ui';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { useBreakoutRoom } from '../../../contexts/BreakoutRoomProvider';
import { DailyBreakoutRoom, DailyBreakoutSession } from '../../../types/next';
import { getListStyle } from '../../../lib/listStyle';
import DraggableParticipant from '../CreateBreakoutModal/DraggableParticipant';
import BreakoutConfigurations from '../../BreakoutConfigurations';

const ManageBreakoutRooms = () => {
  const { breakoutSession, updateSession, manage, setManage } =
    useBreakoutRoom();
  const [newBreakoutSession, setNewBreakoutSession] =
    useState<DailyBreakoutSession>(breakoutSession);
  const [config, setConfig] = useState(breakoutSession?.config);

  useEffect(() => {
    if (breakoutSession === newBreakoutSession) return;

    setNewBreakoutSession(breakoutSession);
  }, [breakoutSession, newBreakoutSession]);

  const handleOnDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source } = result;
      const r = newBreakoutSession?.rooms;

      if (!r) return;

      const destinationDroppableId = Number(destination?.droppableId);
      const sourceDroppableId = Number(source.droppableId);

      r[destinationDroppableId]?.participantIds.push(
        r[sourceDroppableId]?.participantIds[source.index] as string,
      );
      r[sourceDroppableId]?.participantIds.splice(source.index, 1);
      setNewBreakoutSession((newBreakoutSession: DailyBreakoutSession) => {
        return {
          ...newBreakoutSession,
          rooms: r,
        };
      });
    },
    [newBreakoutSession?.rooms],
  );

  const handleSave = async () => {
    const b = newBreakoutSession;
    b.config = config;
    updateSession(b);
    setManage(manage => !manage);
  };

  return (
    <SideSheet
      isShown={manage}
      onCloseComplete={() => setManage(false)}
      width={500}
      containerProps={{
        display: 'flex',
        flex: '1',
        flexDirection: 'column',
      }}
    >
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
          <Pane padding={16} borderBottom="muted">
            <Heading size={600}>Manage breakout rooms</Heading>
            <Paragraph size={400} color="muted">
              Manage the breakout session configurations.
            </Paragraph>
          </Pane>
        </Pane>
        <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
          {newBreakoutSession.rooms.map(
            (room: DailyBreakoutRoom, index: number) => (
              <Pane key={index} marginBottom={10}>
                <Card backgroundColor="white" elevation={0} padding={16}>
                  <Heading>{room.name}</Heading>
                  <Droppable
                    droppableId={index.toString()}
                    direction="horizontal"
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        // @ts-ignore
                        style={getListStyle(
                          snapshot.isDraggingOver,
                          room?.participantIds?.length,
                        )}
                      >
                        {room?.participantIds?.length < 1 && (
                          <Pane
                            width="100%"
                            height="100%"
                            display="flex"
                            textAlign="center"
                            justifyContent="center"
                            alignItems="center"
                          >
                            {snapshot.isDraggingOver ? (
                              <Text color="muted">Drop to add to room</Text>
                            ) : (
                              <Text color="muted">Drag people here</Text>
                            )}
                          </Pane>
                        )}
                        {room?.participantIds?.map(
                          (userId: string, index: number) => (
                            <Draggable
                              key={userId}
                              draggableId={userId}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <DraggableParticipant
                                  provided={provided}
                                  snapshot={snapshot}
                                  userId={userId}
                                  usePresence
                                />
                              )}
                            </Draggable>
                          ),
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              </Pane>
            ),
          )}
          <Pane marginTop={20}>
            <Heading is="h3">Configurations</Heading>
            <BreakoutConfigurations
              manage
              config={config}
              setConfig={setConfig}
            />
          </Pane>
        </Pane>
        <Button
          size="large"
          margin={20}
          appearance="primary"
          onClick={handleSave}
        >
          Save
        </Button>
      </DragDropContext>
    </SideSheet>
  );
};

export default ManageBreakoutRooms;
