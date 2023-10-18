import { fetchApiRoot } from "@/api";
import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";


export const EntryPage = () => {

  const [count, setCount] = useState(0);

  const [ret, setRet] = useState('[NONE]');

  const { t } = useTranslation();


  return <>
    <div>
      <Button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </Button>
      <Button onClick={async () => {
        setRet(JSON.stringify(await fetchApiRoot()));
      }}>
        Fetch
      </Button>
      <p>
        API Entry Return: <code>{ret}</code>
      </p>
      <p >
        I18n test: {t('test')}
      </p>
    </div>
  </>
};


export default EntryPage;