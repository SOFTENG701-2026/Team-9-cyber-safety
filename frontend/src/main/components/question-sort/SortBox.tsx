import React from 'react';
import { useDroppable } from '@dnd-kit/react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';

type SortBoxProps = React.PropsWithChildren<{ id: UniqueIdentifier }>;

const SortBox = ({ id, children }: SortBoxProps) => {
  const { ref } = useDroppable({ id });
  return (
    <div ref={ref}>
      {children}
    </div>
  );
};

export default SortBox;