import React from 'react';
import { useDraggable } from '@dnd-kit/react';
import type { UniqueIdentifier } from '@dnd-kit/abstract';

type SortableProps = React.PropsWithChildren<{
	id: UniqueIdentifier;
	className?: string;
	disabled?: boolean;
}>;

const Sortable = ({ id, children, className, disabled = false }: SortableProps) => {
	const { ref } = useDraggable({ id, disabled });
	return (
		<div ref={ref} className={`inline-flex ${className ?? ''}`}>
			{children}
		</div>
	);
};

export default Sortable;