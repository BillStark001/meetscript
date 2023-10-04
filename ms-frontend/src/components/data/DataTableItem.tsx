import React, { createContext, useContext } from 'react';

export type CurrentTableDataScheme<T> = {
  item: T,
  column?: string
};

const CurrentTableData = createContext<CurrentTableDataScheme<object>>({
  item: {},
  column: undefined,
});

export const CurrentDataProvider = CurrentTableData.Provider;

export const useCurrentTableData = <T, >() => {
  return useContext(CurrentTableData) as CurrentTableDataScheme<T>;
};

// eslint-disable-next-line no-undef
export type DataTableCellHandler<T> = (props: CurrentTableDataScheme<T>) => React.ReactNode & JSX.Element;

export type DataTableCellRendererProps<T> = {
  k: string,
  h: DataTableCellHandler<T>
};

export const DataTableCellRenderer = <T, >(props: DataTableCellRendererProps<T>) => {
  const data = useCurrentTableData<T>();
  const { item, column } = data;
  const { k, h: Handler } = props;
  if (item == undefined || column !== k)
    return <></>;
  return <Handler {...data} />;
};
