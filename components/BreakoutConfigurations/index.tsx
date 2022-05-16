import React, { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Checkbox, Pane } from 'evergreen-ui';
import { DailyBreakoutConfig } from '../../types/next';

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
              disabled={manage}
            />
            minutes
          </>
        }
        checked={config.exp}
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