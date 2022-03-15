import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
} from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Heading,
  Pane,
  PlusIcon,
  Text,
  Paragraph,
} from 'evergreen-ui';
import { DailyParticipant } from '@daily-co/daily-js';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useBreakoutRoom, roomsInitialValue } from './BreakoutRoomProvider';
import { DailyBreakoutProviderRooms, DailyBreakoutRoom } from '../types/next';
import { getListStyle, getSample } from '../utils';

type BreakoutModalType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
};

const BreakoutModal = ({ show, setShow }: BreakoutModalType) => {
  const { rooms, setRooms, config, setConfig, createSession } =
    useBreakoutRoom();

  const sourceValue = useCallback(
    (source: any) => {
      let r,
        duplicateRooms = rooms;
      if (source.droppableId === 'unassigned') {
        r = rooms.unassigned[source.index];
        duplicateRooms.unassigned.splice(source.index, 1);
      } else {
        r = rooms.assigned[source.droppableId].participants[source.index];
        duplicateRooms.assigned[source.droppableId].participants.splice(
          source.index,
          1,
        );
      }
      setRooms(duplicateRooms);
      return r;
    },
    [rooms, setRooms],
  );

  const handleOnDragEnd = useCallback(
    (result: any) => {
      const r = rooms;
      if (result.destination.droppableId !== 'unassigned') {
        r.assigned[Number(result.destination.droppableId)].participants.push(
          sourceValue(result.source),
        );
      } else r.unassigned.push(sourceValue(result.source));
      setRooms({ ...r });
    },
    [rooms, sourceValue, setRooms],
  );

  const handleAddRoom = () => {
    const assigned = rooms.assigned;
    assigned.push({
      name: `Breakout Room ${assigned.length + 1}`,
      room_url: `${process.env.NEXT_PUBLIC_DAILY_ROOM}-${assigned.length + 1}`,
      created: new Date(),
      participants: [],
    });
    setRooms((rooms: DailyBreakoutProviderRooms) => {
      return { ...rooms, assigned };
    });
  };

  const handleAssignEvenly = () => {
    const r: DailyBreakoutProviderRooms = rooms;
    r.assigned.map((room: DailyBreakoutRoom, index: number) => {
      if (room?.participants?.length > 0) {
        r.unassigned.push(...room.participants);
        r.assigned[index].participants = [];
      }
    });
    const chunk = getSample(
      // @ts-ignore
      r.unassigned,
      Math.ceil(r.unassigned.length / r.assigned.length),
    );
    Array.from({ length: r.assigned.length }, (_, i) => {
      r.assigned[i].participants = chunk[i];
    });
    setRooms({ assigned: r.assigned, unassigned: [] });
  };

  const handleRemoveAll = (index: number) => {
    const r = rooms;
    r.unassigned.push(...r.assigned[index].participants);
    r.assigned[index].participants = [];
    setRooms({ ...r });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    type = 'checkbox',
  ) => {
    if (type === 'number') {
      setConfig({ ...config, [e.target.name]: e.target.valueAsNumber });
    } else setConfig({ ...config, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async () => {
    const status = createSession(rooms.assigned as DailyBreakoutRoom[], config);
    // @ts-ignore
    if (status === 'success') {
      setShow(false);
      setRooms(roomsInitialValue(new Date()));
    }
  };

  return (
    <Dialog
      isShown={show}
      title="Create breakout session"
      onCloseComplete={() => setShow(false)}
      preventBodyScrolling
      hasFooter={false}
    >
      <div style={{ overflow: 'auto' }}>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          {rooms.assigned.map((room: DailyBreakoutRoom, index: number) => (
            <div key={index}>
              <Pane display="flex">
                <Pane flex={1} alignItems="center" display="flex">
                  <Heading is="h3">{room.name}</Heading>
                </Pane>
                <Pane>
                  {room?.participants?.length > 0 && (
                    <Button
                      appearance="minimal"
                      intent="danger"
                      size="small"
                      onClick={() => handleRemoveAll(index)}
                    >
                      Remove all
                    </Button>
                  )}
                  <Text>({room.participants?.length || 0} people)</Text>
                </Pane>
              </Pane>
              <Droppable droppableId={index.toString()} direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={getListStyle(snapshot.isDraggingOver)}
                  >
                    {room?.participants?.map(
                      (participant: DailyParticipant, index: number) => (
                        <Draggable
                          key={participant.user_id}
                          draggableId={participant.user_id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Badge
                              margin={2}
                              color="neutral"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {participant.user_name}
                            </Badge>
                          )}
                        </Draggable>
                      ),
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          <Pane display="flex">
            <Pane flex={1} alignItems="center" display="flex">
              <Heading is="h3">Unassigned</Heading>
              <Paragraph color="muted" marginLeft={5}>
                (Drag to assign)
              </Paragraph>
            </Pane>
            <Pane>
              <Text>({rooms.unassigned.length} people)</Text>
            </Pane>
          </Pane>
          <Droppable droppableId="unassigned" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={getListStyle(snapshot.isDraggingOver)}
              >
                {rooms.unassigned.map(
                  (participant: DailyParticipant, index: number) => (
                    <Draggable
                      key={participant.user_id}
                      draggableId={participant.user_id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Badge
                          margin={2}
                          color="neutral"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          {participant.user_name}
                        </Badge>
                      )}
                    </Draggable>
                  ),
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Button onClick={handleAssignEvenly}>Assign evenly</Button>
          <Pane marginTop={10}>
            <Heading is="h3">Configurations</Heading>
            <Checkbox
              name="auto_join"
              label="Let participant join after breakout room started"
              checked={config.auto_join}
              onChange={handleChange}
            />
            <Checkbox
              name="allow_user_exit"
              label="Allow participants to return to main lobby at any time"
              checked={config.allow_user_exit}
              onChange={handleChange}
            />
            <Checkbox
              name="exp"
              label={
                <>
                  Automatically end breakout session after
                  <input
                    name="expiryTime"
                    type="number"
                    min={0}
                    value={config.expiryTime ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleChange(e, 'number')
                    }
                    style={{ margin: '0 5px', width: '40px' }}
                  />
                  minutes
                </>
              }
              checked={config.exp}
              onChange={handleChange}
            />
            <Checkbox
              name="record_breakout_sessions"
              label="Record breakout session (will start automatically)"
              checked={config.record_breakout_sessions}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConfig({
                  ...config,
                  record_breakout_sessions: e.target.checked,
                })
              }
            />
          </Pane>
        </DragDropContext>
      </div>
      <Pane display="flex" marginY={20}>
        <Pane flex={1} alignItems="center" display="flex">
          <Button onClick={() => setShow(false)}>Cancel</Button>
        </Pane>
        <Pane>
          <Button iconAfter={PlusIcon} marginRight={16} onClick={handleAddRoom}>
            Add Room
          </Button>
          <Button
            appearance="primary"
            disabled={rooms.unassigned.length > 0}
            onClick={handleSubmit}
          >
            Open Rooms
          </Button>
        </Pane>
      </Pane>
    </Dialog>
  );
};

export default BreakoutModal;
