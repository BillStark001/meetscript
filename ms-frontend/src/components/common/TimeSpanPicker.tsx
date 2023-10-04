import {
  forwardRef, Input,
  Wrap
} from '@chakra-ui/react';
import { LegacyRef } from 'react';
import { defineStyle, defineStyleConfig } from '@chakra-ui/react'

const xl = defineStyle({
  border: "10px solid",
  borderRadius: 'lg',
})
export const dividerTheme = defineStyleConfig({
  sizes: { xl },
})

export type TimeSpanScheme = {
  startTime?: number;
  endTime?: number;
};

type TimeSpanInnerScheme = {
  date1?: string;
  date2?: string;
  time1?: string;
  time2?: string;
};

const toInnerScheme = ({ startTime, endTime }: TimeSpanScheme): TimeSpanInnerScheme => {

  const startTimeD = startTime != undefined ? new Date(startTime).toISOString().split('T') : undefined;
  const endTimeD = endTime != undefined ? new Date(endTime).toISOString().split('T') : undefined;
  return {
    date1: startTimeD?.[0],
    date2: endTimeD?.[0],
    time1: startTimeD?.[1].substring(0, 5),
    time2: endTimeD?.[1].substring(0, 5),
  };
};

const fromInnerScheme = (inner: TimeSpanInnerScheme): TimeSpanScheme => {
  const today = new Date().toISOString().split('T')[0];
  const { date1, time1, date2, time2 } = inner;
  return {
    startTime: (date1 || time1) ? new Date(`${date1 ?? today}T${time1}:00.000Z`).getTime() : undefined,
    endTime: (date2 || time2) ? new Date(`${date2 ?? date1 ?? today}T${time2}:00.000Z`).getTime() : undefined,
  }
};

export type TimeSpanPickerProps = TimeSpanScheme & {
  onChange?: (newValue: TimeSpanScheme, oldValue: TimeSpanScheme) => void;
  differentDate?: boolean;
};

export const TimeSpanPicker = (props: TimeSpanPickerProps, ref: LegacyRef<HTMLDivElement>) => {
  const { startTime, endTime, onChange, differentDate } = props;
  const scheme = toInnerScheme({ startTime, endTime });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: keyof TimeSpanInnerScheme
  ) => {
    const value = event.target?.value || undefined;
    const newScheme: TimeSpanInnerScheme = { ...scheme, [key]: value };
    onChange?.(fromInnerScheme(newScheme), fromInnerScheme(scheme));
  };

  return <Wrap ref={ref}>
    <label>
      <Input size="md" type="date" value={scheme.date1} onChange={e => handleChange(e, 'date1')} />
    </label>
    <label>
      <Input size="md" type="time" value={scheme.time1} onChange={e => handleChange(e, 'time1')} />
    </label>
    <span> - </span>
    {differentDate ? <label>
      <Input size="md" type="date" value={scheme.date2} onChange={e => handleChange(e, 'date2')} />
    </label> : undefined}
    <label>
      <Input size="md" type="time" value={scheme.time2} onChange={e => handleChange(e, 'time2')} />
    </label>
  </Wrap>;
}
export default forwardRef(TimeSpanPicker);