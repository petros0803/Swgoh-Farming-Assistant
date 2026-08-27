import { useId } from 'react';
import styled from 'styled-components';

export default function SharedTag({ badge }) {
  const kind = badge.className === 'tag-recommended' ? 'recommended' : 'shared';
  const farms = badge.farms ?? [];
  const tipId = useId();

  if (farms.length === 0) {
    return <Tag $kind={kind}>{badge.text}</Tag>;
  }

  return (
    <Tag $kind={kind} $interactive tabIndex={0} aria-describedby={tipId}>
      {badge.text}
      <Tip id={tipId} role="tooltip">
        <TipHeading>Also needed for</TipHeading>
        <TipList>
          {farms.map((farm) => (
            <li key={farm}>{farm}</li>
          ))}
        </TipList>
      </Tip>
    </Tag>
  );
}

const Tip = styled.span`
  position: absolute;
  bottom: calc(100% + ${({ theme }) => theme.space[3]});
  left: 0;
  width: max-content;
  max-width: min(${({ theme }) => theme.sizes.tip}, calc(100vw - 32px));
  background-color: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.body};
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[6]}`};
  box-shadow: ${({ theme }) => theme.shadows.lift};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  letter-spacing: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s, visibility 0.15s;
  z-index: ${({ theme }) => theme.zIndex.tip};
`;

const TipHeading = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const TipList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};

  li {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: ${({ theme }) => theme.lineHeights.snug};
    color: ${({ theme }) => theme.colors.text};
    white-space: nowrap;
  }
`;

const Tag = styled.span`
  position: relative;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: ${({ theme }) => `${theme.space[2]} 7px`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $kind }) => ($kind === 'recommended' ? theme.colors.recommendedBg : theme.colors.sharedBg)};
  color: ${({ theme, $kind }) => ($kind === 'recommended' ? theme.colors.recommendedText : theme.colors.blue)};
  border: 1px solid ${({ theme, $kind }) => ($kind === 'recommended' ? theme.colors.recommendedBorder : theme.colors.sharedBorder)};
  cursor: ${({ $interactive }) => ($interactive ? 'help' : 'default')};

  &:hover ${Tip},
  &:focus ${Tip},
  &:focus-visible ${Tip} {
    opacity: 1;
    visibility: visible;
  }
`;
