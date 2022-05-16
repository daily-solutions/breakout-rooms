import { DailyBreakoutProviderRooms } from '../types/next';

export const getRoomsInitialValues = (
  room: string,
  date: Date,
): DailyBreakoutProviderRooms => {
  return {
    assigned: [
      {
        name: 'Breakout Room 1',
        roomName: `${room}-1`,
        created: date,
        participants: [],
      },
      {
        name: 'Breakout Room 2',
        roomName: `${room}-2`,
        created: date,
        participants: [],
      },
    ],
    unassignedParticipants: [],
  };
};