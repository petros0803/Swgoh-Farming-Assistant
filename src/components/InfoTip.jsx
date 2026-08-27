import { useId, useState } from 'react';
import styled from 'styled-components';

export default function InfoTip({ html, label = 'Farming strategy for this event' }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <Tip
      type="button"
      aria-label={label}
      aria-expanded={open}
      aria-controls={tipId}
      onClick={() => setOpen((value) => !value)}
      onBlur={() => setOpen(false)}
    >
      ?
      <Body id={tipId} dangerouslySetInnerHTML={{ __html: html }} />
    </Tip>
  );
}

const Body = styled.span`
  position: absolute;
  bottom: 120%;
  right: 0;
  width: min(${({ theme }) => theme.sizes.tip}, calc(100vw - 32px));
  background-color: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.body};
  text-align: left;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[6]}`};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  line-height: ${({ theme }) => theme.lineHeights.body};
  letter-spacing: 0;
  box-shadow: ${({ theme }) => theme.shadows.lift};
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s, visibility 0.15s;
  z-index: ${({ theme }) => theme.zIndex.tip};
  text-transform: none;

  ${({ theme }) => theme.media.phone} {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
`;

const Tip = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.sizes.tap};
  height: ${({ theme }) => theme.sizes.tap};
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.raised};
  border: 1px solid ${({ theme }) => theme.colors.muted};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: help;
  flex-shrink: 0;

  &:hover ${Body},
  &:focus ${Body},
  &:focus-visible ${Body},
  &[aria-expanded='true'] ${Body} {
    opacity: 1;
    visibility: visible;
  }
`;
