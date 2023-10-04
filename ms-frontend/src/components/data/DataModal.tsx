/* eslint-disable comma-spacing */
import {
  Modal,
  chakra, Text,
  ModalOverlay, ModalContent, ModalHeader, ModalBody, Grid, GridItem,
  FormControl, FormLabel, Input, Select, ModalFooter, ModalCloseButton,
  Wrap, NumberInput, NumberInputField, NumberDecrementStepper,
  NumberIncrementStepper, NumberInputStepper, Textarea,
  HStack, Box, Checkbox, SimpleGrid, Button
} from '@chakra-ui/react';
import React, {
  createContext, PropsWithChildren, ReactNode, useContext, useEffect
} from 'react';
import {
  DefaultValues,
  FieldValues, Path, RegisterOptions, useForm,
  UseFormHandleSubmit, UseFormRegister,
  UseFormSetValue, UseFormWatch
} from 'react-hook-form';
import { composeOptions, NumberMapR, StringMapR } from '@/utils/components';
import { DataModalItemProps, DataModalReadonlyDisplay, ModalItemProvider } from './DataModalItem';
import { expandGhostNodes } from './utils';


export type ObjectKey = string | number | symbol;
export type DataModalSubmissionState = 'create' | 'update' | 'delete' | 'replace' | 'close';
// eslint-disable-next-line no-unused-vars
export type DataModalSubmission<S extends ObjectKey = DataModalSubmissionState, T = FieldValues> = (state: S, form: Partial<T>) => void;


export type DataModalStyle = {
  columns?: number,
  title?: React.ReactNode,
  closeOnOverlayClick?: boolean,
  labelPosition?: 'top' | 'left',

  mt?: number | string,
};


export type DataModalProperties<
  T extends FieldValues,
  S extends ObjectKey = DataModalSubmissionState
> = DataModalStyle & {

  children: ReactNode;

  data: T;
  formData?: T;

  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: DataModalSubmission<S>;

};

export type DataModalButtonProperties<S> = PropsWithChildren<{
  state: S,
  label?: string,
  disabled?: boolean,
}>;

export type DataModalCheckboxProperties = PropsWithChildren<{
  state: string,
  isChecked: boolean,
  style?: object,
  label?: string,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}>;


export const DATA_MODAL_NO_DESC: React.ReactNode = <>NO DESC</>;

export type DataModalItemGeneralProps<
  T extends FieldValues,
  K extends Path<T> = Path<T>
> = {
  target: K,
  desc?: React.ReactNode,

} & ({
  type?: 'readonly',
  format?: (field: T[keyof T], obj: T) => string,
  display?: DataModalReadonlyDisplay,
  list?: NumberMapR | StringMapR,
} | {
  type: 'dummy'
} | (
    {
      options?: RegisterOptions<T, K>
    } & ({
      type: 'string',
      rows?: number,
      list?: StringMapR,
    } | {
      type: 'number',
      list?: NumberMapR,
    } | {
      type: 'custom',
      useReg?: boolean,
      children: React.ReactNode | React.ReactNode[],
    })
  ));


type FormContentData<T extends FieldValues, S extends ObjectKey> = {
  data?: T;
  onSubmit?: DataModalSubmission<S>;
  handleSubmit?: UseFormHandleSubmit<T>;
  isSubmitting?: boolean;
  register?: UseFormRegister<T>;
  setValue?: UseFormSetValue<T>;
  watch?: UseFormWatch<T>;
}


type ModalStateScheme = {
  state?: 'body' | 'header' | 'footer' | 'groups' | undefined;
  params?: string[];
}
type M = FormContentData<FieldValues, ObjectKey>;

const FormContent = createContext<M>({});
const ModalState = createContext<ModalStateScheme>({});

export const useFormContent = <T extends FieldValues = FieldValues, S extends ObjectKey = ObjectKey>() => useContext(FormContent) as FormContentData<T, S>;


export const DataModalButton = <S extends ObjectKey,>(props: DataModalButtonProperties<S>) => {
  const { state, label, disabled, children } = props;
  const { onSubmit, handleSubmit, isSubmitting } = useFormContent();
  const { state: modalState } = useContext(ModalState);

  if (modalState !== 'footer')
    return <></>;

  return <Button
    type='button'
    onClick={
      (onsubmit !== undefined && handleSubmit !== undefined) ?
        handleSubmit((d) => onSubmit?.call(undefined, state, d)) :
        undefined
    }
    isLoading={isSubmitting ?? false}
    isDisabled={disabled ?? isSubmitting ?? false}
  >
    {label}
    {children}
    {!label && !children ? String(state) : undefined}
  </Button>;

};


export const DataModalCheckbox = (props: DataModalCheckboxProperties) => {
  const { state, isChecked, label, onChange, children } = props;
  const { state: modalState } = useContext(ModalState);

  if (modalState !== 'footer')
    return <></>;

  return (
    <Checkbox
      style={{ marginLeft: '20px' }}
      isChecked={isChecked}
      onChange={onChange}
    >
      {label}
      {children}
      {!label && !children ? String(state) : undefined}
    </Checkbox>
  );
};

const DefaultReadonlyItem: DataModalReadonlyDisplay = ({ value }) => {
  return <Text
    padding={1}
  >
    {value}
  </Text>
};

export const DataModalItem = <T extends FieldValues, K extends Path<T> = Path<T>>(props: DataModalItemGeneralProps<T, K>) => {

  const { data, register, setValue } = useFormContent<T>();
  const { state, params } = useContext(ModalState);
  const dataT = (data ?? {}) as T;

  if (state !== 'body' || register === undefined)
    return <></>;

  const key = `fc_inner_${String(props.target)}_${props.type}`;
  const leftDesc = params?.[0] === 'left';
  const desc = props.desc === DATA_MODAL_NO_DESC ?
    undefined :
    (props.desc ?? String(props.target) ?? undefined);

  let retInner: React.ReactNode;

  if (props.type === 'readonly' || props.type === undefined) {
    // readonly field
    const t = dataT[props.target];
    const displayValue =
      props.format ? props.format(t, dataT) :
        props.list ? String(props.list.get(t as unknown as never)) ?? '' :
          String(t ?? '');

    const Display = props.display ?? DefaultReadonlyItem;
    retInner = <Display
      value={displayValue}
    />;

  } else if (props.type === 'dummy') {
    // dummy field
    retInner = <></>;

  } else if (props.type === 'custom') {
    // custom field
    const itemProps: DataModalItemProps<K> = {
      target: props.target,
      reg: props.useReg ? register(
        props.target,
        props.options
      ) : undefined,
    };
    retInner = <ModalItemProvider value={itemProps}>
      {props.children}
    </ModalItemProvider>;
  } else if (props.type === 'string' || props.type === 'number') {
    // textfield
    const isNumber = props.type === 'number';
    const options: RegisterOptions<T, K> = Object.assign({
      valueAsNumber: isNumber,
    }, props.options);
    const reg = {
      ...register(
        props.target,
        options
      )
    };
    // TODO this maybe dangerous
    if (setValue !== undefined && (options.value !== undefined))
      useEffect(() => {
        if (options.value !== undefined)
          setValue(props.target, options.value);
      }, [setValue]);

    if (props.list !== undefined) {
      retInner = <Select {...reg}>
        {composeOptions(props.list)}
      </Select>;
    } else {
      if (isNumber) {
        retInner = <NumberInput
          min={typeof props.options?.min === 'number' ? props.options?.min : undefined}
          max={typeof props.options?.max === 'number' ? props.options?.max : undefined}
          defaultValue={0}>
          <NumberInputField {...reg} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>;
      } else {
        if (props.rows == undefined || props.rows < 1) {
          retInner = <Input
            type='text'
            {...reg}
          />;
        } else {
          retInner = <Textarea
            rows={props.rows}
            resize={'none'}
            {...reg}
          />;
        }
      }
    }

  } else {
    throw new Error('should not happen: ' + JSON.stringify(props));
  }


  return (
    <DataModalItemWrapper key={key} left={leftDesc} desc={desc}>
      {retInner}
    </DataModalItemWrapper>
  );
};

const DataModalItemWrapper = (props: PropsWithChildren<{
  left?: boolean,
  desc?: React.ReactNode
}>) => {
  const { left, desc, children } = props;
  if (desc == undefined) {
    return <FormControl>
      {children}
    </FormControl>;
  }
  if (left) {
    return <FormControl>
      <HStack w="100%" paddingTop='5px' align='flex-start'>
        <Box minWidth='65px' maxWidth='400px'>{desc}</Box>
        <Box flex={1}>{children}</Box>
      </HStack>
    </FormControl>;
  }
  return <FormControl>
    <FormLabel paddingTop='5px'>
      {desc}
    </FormLabel>
    {children}
  </FormControl>;
};

const DataModalBody = (props: PropsWithChildren<DataModalStyle>) => {
  const { columns, children } = props;
  return <ModalState.Provider value={{
    state: 'body',
    params: [props.labelPosition ?? 'top']
  }}>
    <SimpleGrid columns={columns ?? 2} gap={2}>
      {expandGhostNodes(children)
        .map((x, i) => <React.Fragment key={i}>{x}</React.Fragment>)}
    </SimpleGrid>

  </ModalState.Provider>;
};

export const DataModalGroup = (props: PropsWithChildren<DataModalStyle>) => {
  const { state } = useContext(ModalState);
  if (state !== 'groups')
    return <></>;
  const pTitle = props.title;
  const pCol = (props.columns ?? 2) < 1 ? 1 : props.columns ?? 2;
  return <Grid>
    {pTitle !== undefined &&
      <FormLabel paddingTop='5px'>
        {pTitle}
      </FormLabel>}
    <DataModalBody {...props} columns={pCol} />
  </Grid>;
};

export const DataModal = <
  T extends FieldValues,
  S extends ObjectKey
>(props: DataModalProperties<T, S>) => {
  const { isOpen, onClose, onSubmit, data } = props;
  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: (props.formData ?? props.data) as DefaultValues<T>
  });

  const packed: FormContentData<T, S> = {
    data: data,
    onSubmit: onSubmit,
    handleSubmit: handleSubmit,
    isSubmitting: isSubmitting,
    register: register,
    setValue: setValue,
    watch: watch,
  };

  const pCol = (props.columns ?? 2) < 1 ? 1 : props.columns ?? 2;

  /**
   * _c.map((c, i) =>
          React.isValidElement(c) ?
            (<React.Fragment key={`fr_${i}`} > {React.cloneElement(c)} </React.Fragment>) :
            c)
   */

  const modalBody = <DataModalBody columns={pCol}>
    {props.children}
  </DataModalBody>;

  const modalGroups = <ModalState.Provider value={{ state: 'groups' }}>
    <Grid templateColumns={'repeat(1, 1fr)'} gap={2}>
      {props.children}
    </Grid>
  </ModalState.Provider>;

  const modalFooter = <ModalState.Provider value={{ state: 'footer' }}>
    <Wrap gap={2} width={'100%'} justify={'space-between'}>
      {props.children}
    </Wrap>
  </ModalState.Provider>;


  if (onClose === undefined || isOpen === undefined) {
    return <FormContent.Provider
      value={packed as M}>
      <chakra.form>
        <Grid gap={2}>
          <GridItem>
            {modalBody}
            {modalGroups}
          </GridItem>
          <GridItem>
            {modalFooter}
          </GridItem>
        </Grid>
      </chakra.form>
    </FormContent.Provider>;
  }

  return (
    <Modal
      size={pCol > 1 ? `${pCol}xl` : undefined}
      isOpen={isOpen}
      onClose={onClose}
      autoFocus={false}
      closeOnOverlayClick={!!props.closeOnOverlayClick}
    >
      <FormContent.Provider
        value={packed as M}>
        <chakra.form>
          <ModalOverlay />
          <ModalContent pb={2} marginTop={props.mt ?? undefined}>

            <ModalHeader>
              {props.title ?? 'Modal'}
            </ModalHeader>

            <ModalBody mx={2}>
              {modalBody}
              {modalGroups}
            </ModalBody>

            <ModalFooter>
              {modalFooter}
            </ModalFooter>

            <ModalCloseButton />
          </ModalContent>
        </chakra.form>
      </FormContent.Provider>
    </Modal >
  );
};