import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { Button, TextInput, Detail, withTheme, FluentHover, Spinner } from '@theemeraldtree/emeraldui';
import Overlay from '../../../component/overlay/overlay';
import AlertBackground from '../../../component/alert/alertbackground';
import MCAccountsHandler from '../../../minecraft/mcAccountsHandler';
import RadioButton from '../../../component/radioButton/radioButton';
import AlertManager from '../../../manager/alertManager';

const PasswordInput = styled(TextInput).attrs({
  type: 'password'
})``;

const Account = styled.div`
  width: calc(100% - 20px);
  height: 75px;
  background: #313131;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
  cursor: pointer;
  color: white;
  transition: 150ms;
  h1 {
    font-size: 14pt;
  }
  img {
    width: 40px;
    image-rendering: pixelated;
    margin: 10px;
  }
  button:first-child {
    margin: 10px;
  }
  & > div {
    position: absolute;
    right: 10px;
  }
  ${props => props.active && css`
    background: #4a4a4a !important;
    cursor: default;
  `}
`;

const Header = styled.div`
  margin: 10px;
  margin-left: 0;
  padding: 10px;
  button {
    margin-right: 5px;
  }
`;

const ButtonContainer = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  div {
    margin: 2px;
  }
  display: flex;
  align-items: center;
  button {
    margin-left: 5px;
  }
`;

const CenterSpinner = styled.div`
  width: 100%;
  height: 100%;
  padding-top: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AccountError = styled.div`
  background: #313131;
  padding: 10px;
  margin-bottom: 20px;
  margin-top: 10px;
`;

const AB = styled(AlertBackground)`
  width: 260px;
`;

const List = styled.div`
  & > h1 {
    text-align: center;
    font-size: 21pt;
    margin-top: 50px;
  }

  & > h3 {
    text-align: center;
    font-weight: 300;
  }
`;

function Accounts({ theme }) {
  const [accounts, setAccounts] = useState(MCAccountsHandler.getAccounts());
  const [addAccountStage, setAddAccountStage] = useState(0);
  const [addAccountError, setAddAccountError] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addAccountEmail, setAddAccountEmail] = useState('');
  const [addAccountPW, setAddAccountPW] = useState('');

  const changeAddAccountEmail = e => {
    setAddAccountEmail(e.target.value);
  };

  const changeAddAccountPW = e => {
    setAddAccountPW(e.target.value);
  };

  const loginAddAccount = async () => {
    // setShowAddAccount(false);
    setAddAccountStage(1);
    const verify = await MCAccountsHandler.registerAccount(addAccountEmail, addAccountPW);
    if (verify === 'good') {
      setAddAccountStage(0);
      setShowAddAccount(false);
      const accs = MCAccountsHandler.getAccounts();
      MCAccountsHandler.setActiveAccount(MCAccountsHandler.getAccountByEmail(addAccountEmail).uuid);
      setAccounts([...accs]);
      setAddAccountEmail('');
      setAddAccountPW('');
    } else {
      setAddAccountStage(0);
      setAddAccountError(verify);
    }
  };

  const setActiveAccount = (account, ref) => {
    MCAccountsHandler.setActiveAccount(account.uuid);
    setAccounts([...MCAccountsHandler.getAccounts()]);

    if (ref) {
      FluentHover.mouseLeave(ref, '#313131');
    }
  };


  const logOutClick = (e, account) => {
    e.stopPropagation();
    AlertManager.alert('are you sure?', `Are you sure you want to log out of <b>${account.name}</b>?`, () => {
      const selectedIndex = MCAccountsHandler.getAccounts().findIndex(acc => acc.email === account.email);
      MCAccountsHandler.deleteAccount(account.email);
      setAccounts([...MCAccountsHandler.getAccounts()]);
      if (selectedIndex + 1 > MCAccountsHandler.getAccounts().length) {
        if (MCAccountsHandler.getAccounts()[0]) {
          setActiveAccount(MCAccountsHandler.getAccounts()[0]);
        }
      }
    }, 'log out', 'cancel');
  };

  const clickAddAccount = () => {
    setAddAccountError('');
    setAddAccountEmail('');
    setAddAccountPW('');
    setAddAccountStage(0);
    setShowAddAccount(true);
  };

  return (
    <>
      <Overlay in={showAddAccount}>
        <AB>
          <h1>add an account</h1>
          {addAccountStage === 0 && (
          <>
            {addAccountError && <AccountError>{addAccountError}</AccountError>}
            <Detail>mojang email/username</Detail>
            <TextInput value={addAccountEmail} onChange={changeAddAccountEmail} />
            <Detail>password</Detail>
            <PasswordInput theme={theme} type="password" value={addAccountPW} onChange={changeAddAccountPW} />

            <ButtonContainer>
              <Button onClick={() => setShowAddAccount(false)} color="red">cancel</Button>
              <Button onClick={loginAddAccount} color="green">add account</Button>
            </ButtonContainer>
          </>
          )}
          {addAccountStage === 1 && (
            <CenterSpinner>
              <Spinner />
            </CenterSpinner>
          )}
        </AB>
      </Overlay>
      <Header>
        <Button onClick={clickAddAccount} color="green">Add Account</Button>
        <Button color="#333333">Help</Button>
      </Header>
      <List>
        {accounts.map(account => {
          const active = MCAccountsHandler.getActiveAccount() === account.uuid;
          const ref = React.createRef();
          return (
            <Account
              active={active}
              onClick={() => setActiveAccount(account, ref)}
              key={account.email}
              ref={ref}
              onMouseMove={e => !active && FluentHover.mouseMove(e, ref, '#313131', true, true)}
              onMouseLeave={() => FluentHover.mouseLeave(ref, '#313131')}
            >
              <RadioButton onClick={() => setActiveAccount(account)} active={active} />
              {account.headTexture && <img src={account.headTexture} alt="" />}
              <h1>{account.name}</h1>
              <div>
                <Button color="#6E6E6E" onClick={e => logOutClick(e, account)}>Log out</Button>
              </div>
            </Account>
        );
        })}
        {!accounts.length && (
        <>
          <h1>There's nothing here!</h1>
          <h3>You need to add an account in order to launch the game</h3>
        </>
        )}
      </List>
    </>
  );
}

Accounts.propTypes = {
  theme: PropTypes.object
};

export default withTheme(Accounts);
