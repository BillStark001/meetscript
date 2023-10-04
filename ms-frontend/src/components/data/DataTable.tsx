/* eslint-disable comma-spacing */
import { RepeatIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Atom, useAtom } from 'jotai';
import React, { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';


export type SortOrder = 'none' | 'ascending' | 'descending';

export type SortDefinition<T> = {
  sort?: (x: T, y: T) => number, // enabled if assigned
  sortOrder?: SortOrder, // default if assigned
}

export type SortFunction<T> = (a: T, b: T) => number;

export type DataTableCellProps<T> = React.PropsWithChildren<{
  target: keyof T | string | ((t: T, i: number) => React.ReactNode),
  header?: React.ReactNode,
  format?: (val: T[keyof T], t: T, i: number) => React.ReactNode,
} & SortDefinition<T>>;


export type DataTableProps<T> = React.PropsWithChildren<{
  data: T[] | Atom<T[]>;
  noData?: React.ReactNode;

  tableShadow?: boolean;
  filter?: (obj: T, index: number) => boolean;
  onSelected?: (obj: T, index: number) => void;
} & SortDefinition<T>>;

const DEFAULT_NO_DATA = 'No Data';

const RenderStageContext = createContext<'head' | 'body'>('body');

type _S<T> = SortDefinition<T> & {
  sortIndex: number,
  changeSort: (sorter: SortFunction<T> | undefined, index: number, order: SortOrder) => void,
};

type _I<T> = [number, T];

const SortContext = createContext<_S<unknown>>({ sortIndex: -2, changeSort() { /* empty*/ } });
const IndexContext = createContext<number>(-1);
const DataRowContext = createContext<_I<unknown>>([-1, undefined]);

const useSortContext = <T,>() => (useContext<_S<unknown>>(SortContext) as _S<T>);
const useDataRowContext = <T,>() => (useContext(DataRowContext) as _I<T>);

const DataTableHeaderCell = <T,>(props: PropsWithChildren<{
  enableSort: boolean,
  sorter?: SortFunction<T>
}>) => {
  const index = useContext(IndexContext);
  const { sortOrder, sortIndex, changeSort } = useSortContext<T>();

  return <>
    {props.children}
    {props.enableSort && (
      sortIndex === index ? (
        sortOrder === 'ascending' ? <TriangleUpIcon onClick={() => changeSort(props.sorter, index, 'descending')} /> :
          sortOrder === 'descending' ? <TriangleDownIcon onClick={() => changeSort(props.sorter, index, 'none')} /> :
            <RepeatIcon onClick={() => changeSort(props.sorter, index, 'ascending')} />
      ) : <RepeatIcon onClick={() => changeSort(props.sorter, index, 'ascending')} />
    )}
  </>;
};

export const DataTableCell = <T,>(props: DataTableCellProps<T>) => {
  const isRenderingHead = useContext(RenderStageContext) === 'head';
  const [index, item] = useDataRowContext<T>();
  if (isRenderingHead) {
    return <DataTableHeaderCell
      enableSort={props.sort != undefined}
      sorter={props.sort}
    >
      {props.header ?? <span>{String(props.target)}</span>}
    </DataTableHeaderCell>;
  }
  // else it is rendering body
  const { target, format } = props;
  if (typeof target === 'function')
    return <>{target(item, index)}</>;
  const ret = item?.[target as keyof T];
  if (format)
    return <>{ret != undefined ? format(ret, item, index) : undefined}</>;
  return <>{String(ret ?? '')}</>;
};


export const DataTable = <T,>(props: DataTableProps<T>) => {

  const { data, noData, filter, onSelected, children } = props;
  const itemListRaw = useMemo(() => {
    const list = (data instanceof Array ? data : (useAtom(data)[0]))
      .map((x, i) => [i, x] as [number, T]);
    if (filter)
      return list.filter(([i, x]) => filter(x, i));
    return list;
  }, [data, filter]);


  const tableShadow: boolean = props.tableShadow ?? false;

  const [sorter, setSorter] = useState<SortFunction<T>>();
  const [sortIndex, setSortIndex] = useState<number>(-1);
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const sorterInUse = sorter ?? props.sort;
  const sortOrderInUse = (sortOrder && sortOrder !== 'none') ? sortOrder :
    (props.sortOrder && props.sort && props.sortOrder !== 'none') ?
      props.sortOrder : 'none';
  const itemList = useMemo(() => {
    if (sortOrderInUse === 'none' || sorterInUse == undefined)
      return itemListRaw;
    return itemListRaw.sort(([, x], [, y]) => {
      const sortResult = sorterInUse(x, y);
      return sortOrderInUse === 'descending' ? -sortResult : sortResult;
    }
    );
  }, [itemListRaw, sorterInUse, sortOrderInUse]);

  if (itemListRaw.length == 0)
    return <div>{noData ?? DEFAULT_NO_DATA}</div>;

  return <>
    <TableContainer>
      <Table variant='striped' colorScheme='teal'>

        <Thead>
          <Tr>
            <SortContext.Provider value={{
              sort: sorter as SortFunction<unknown>,
              sortIndex,
              sortOrder,
              changeSort(sorter, index, order) {
                setSorter(() => sorter);
                setSortIndex(index);
                setSortOrder(order);
              },
            }}>
              <RenderStageContext.Provider value={'head'}>
                {React.Children.map(
                  children,
                  (x, i) =>
                    <IndexContext.Provider key={i} value={i}>
                      <Th>{x}</Th>
                    </IndexContext.Provider>
                )}
              </RenderStageContext.Provider>
            </SortContext.Provider>
          </Tr>
        </Thead>

        <Tbody>
          {itemList.map(([realIndex, item]) =>
            <DataRowContext.Provider value={[realIndex, item]} key={realIndex}>
              <Tr
                cursor={props.onSelected ? 'pointer' : 'cursor'}
                onClick={() => onSelected?.(item, realIndex)}
                _hover={tableShadow ? { boxShadow: '0px 0px 12px rgba(0, 0, 0, 0.3)' } : {}}>
                {React.Children.map(
                  children,
                  (x, i) => <Td key={i}>{x}</Td>
                )}
              </Tr>
            </DataRowContext.Provider>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  </>;
};

export default DataTable;
