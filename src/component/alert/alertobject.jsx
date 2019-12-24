import React from 'react';
import styled from 'styled-components';
import Button from '../button/button';

const BG = styled.div`
    width: 100%;
    height: fit-content;
    max-width: 350px;
    max-height: 200px;
    margin: 10px;
    background-color: #222;
    color: white;
    position: relative;
    padding: 10px;
    padding-bottom: 70px;
    h1 {
        margin: 0;
        font-weight: 200;
        font-size: 21pt;
    }
`;

const InputContainer = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
    div {
        margin: 2px;
    }
    display: flex;
    align-items: center;
`;

export default function AlertObject({ children, buttons }) {
    return (
        <BG>
            <div dangerouslySetInnerHTML={{ __html: children }} />
            
            <InputContainer>
                {buttons.map(button => (
                
                    <Button key={button.text} 
                        onClick={button.onClick}
                        color={button.color}
                        >
                            {button.text}
                    </Button>
                ))}
            </InputContainer>
        </BG>
    )
}