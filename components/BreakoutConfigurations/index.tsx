import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
} from 'react';
import { Checkbox, Pane } from 'evergreen-ui';
import { DailyBreakoutConfig } from '../../types/next';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import { useDaily } from '@daily-co/daily-react-hooks';

type Props = {
  config: DailyBreakoutConfig;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  manage?: boolean;
};

const BreakoutConfigurations = ({
  config,
  setConfig,
  manage = false,
}: Props) => {
  const daily = useDaily();
  const { autoAssign } = useBreakoutRoom();

  const handleParticipantsConfigChange = useCallback(
    (config: DailyBreakoutConfig) => {
      if (!daily) return;

      if (config.max_participants && config.max_participants_count) {
        const maxParticipants = config.max_participants_count as number;
        const participants = daily.participants();
        const totalParticipants = Object.keys(participants).length;
        const maxNumberOfRooms = Math.ceil(totalParticipants / maxParticipants);
        autoAssign(maxNumberOfRooms);
      }
    },
    [autoAssign, daily],
  );

  const handleMaxParticipantsCountChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setConfig(config => {
      const newConfig = config;
      newConfig.max_participants_count = e.target.valueAsNumber;
      handleParticipantsConfigChange(newConfig);

      return { ...newConfig };
    });
  };

  const handleMaxParticipantsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfig(config => {
      const newConfig = config;
      newConfig.max_participants = e.target.checked;
      handleParticipantsConfigChange(newConfig);

      return { ...newConfig };
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    type = 'checkbox',
  ) => {
    if (type === 'number')
      setConfig({ ...config, [e.target.name]: e.target.valueAsNumber });
    else setConfig({ ...config, [e.target.name]: e.target.checked });
  };

  return (
    <Pane>
      <Checkbox
        name="max_participants"
        label={
          <>
            Assign max participants of
            <input
              name="max_participants_count"
              type="number"
              min={0}
              value={config.max_participants_count ?? ''}
              onChange={handleMaxParticipantsCountChange}
              style={{ margin: '0 5px', width: '40px' }}
              disabled={manage}
            />
            per each room
          </>
        }
        checked={config.max_participants}
        onChange={handleMaxParticipantsChange}
        disabled={manage}
      />
      <Checkbox
        name="allow_user_switch_room"
        label="Let participant switch between rooms"
        checked={config.allow_user_switch_room}
        onChange={handleChange}
      />
      <Checkbox
        name="auto_join"
        label="Let participant join after breakout room starts"
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
              disabled={manage}
            />
            minutes
          </>
        }
        checked={!!config.exp}
        onChange={handleChange}
        disabled={manage}
      />
      <Checkbox
        name="record_breakout_sessions"
        label="Record breakout session (will start automatically)"
        checked={config.record_breakout_sessions}
        onChange={handleChange}
        disabled={manage}
      />
    </Pane>
  );
};

export default BreakoutConfigurations;
