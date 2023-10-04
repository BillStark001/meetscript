import React, { createContext, useContext } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export type DataModalItemProps<K extends string> = {
  target?: K,
  reg?: UseFormRegisterReturn<K>
};

export type DataModalItemHandler<
  K extends string = string,
  P extends DataModalItemProps<K> = DataModalItemProps<K>
// eslint-disable-next-line no-undef, no-unused-vars
> = (props: P) => React.ReactNode & JSX.Element;

export type DataModalReadonlyDisplay<T = string> = React.FunctionComponent<{
  value: T;
}>;

const ModalItemContext = createContext<DataModalItemProps<string>>({
  target: undefined,
  reg: undefined,
});

export const ModalItemProvider = ModalItemContext.Provider;

export const useDataModalItem = <
  K extends string = string,
  P extends DataModalItemProps<K> = DataModalItemProps<K>
>() => useContext(ModalItemContext) as P;


export const DataModalItemRenderer = <
  K extends string = string,
  P extends DataModalItemProps<K> = DataModalItemProps<K>
>({ h }: { h: DataModalItemHandler<K, P> }) => {
  const Handler = h;
  const props = useDataModalItem<K, P>();
  return <Handler {...props} />;
};