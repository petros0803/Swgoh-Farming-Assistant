import styled from 'styled-components';

export default function TextField({ id, className, ...props }) {
  return <Input id={id} className={className} {...props} />;
}

const Input = styled.input`
  background-color: ${({ theme }) => theme.colors.bg};
  border: ${({ theme }) => theme.borders.thin} solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[8]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  outline: none;
  font-family: ${({ theme }) => theme.fonts.body};
  min-height: ${({ theme }) => theme.sizes.tap};
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.dim};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focus};
  }
`;
