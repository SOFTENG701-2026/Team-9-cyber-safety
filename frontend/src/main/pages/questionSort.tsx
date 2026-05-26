import { useState } from "react";
import { DragDropProvider } from '@dnd-kit/react';

import SortBox from "../components/question-sort/SortBox.tsx"
import Sortable from "../components/question-sort/Sortable.tsx";

import safeFace from '../../resources/icons/Safe-Face.png';
import unsafeFace from '../../resources/icons/Unsafe-Face.png';

interface SortableItem {
  id: string;
  target: 'middle' | 'safe' | 'unsafe';
  answer: 'safe' | 'unsafe'
  label: string;
}

type QuestionSortProps = {
  embedded?: boolean;
  onSubmit?: () => void;
};

const QuestionSort = ({ embedded = false, onSubmit }: QuestionSortProps) => {
  const sortableCardClass = "w-[389px] h-[77px] rounded-[20px] border-[5px] border-[#3B6D11] bg-white flex items-center justify-center";
  const headingTextClass = "text-[#3B6D11] text-center font-['Holtwood_One_SC'] text-[64px] font-normal leading-normal flex w-[302px] h-[123px] flex-col items-center justify-center";
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const getSortableTextStyle = (label: string) => {
    const length = label.trim().length;
    const maxFontSize = 36;
    const minFontSize = 16;
    const pivotLength = 16;
    const shrinkPerCharacter = 0.5;

    const calculatedSize = maxFontSize - Math.max(0, length - pivotLength) * shrinkPerCharacter;
    const fontSize = Math.min(maxFontSize, Math.max(minFontSize, calculatedSize));

    const compressionRatio = (maxFontSize - fontSize) / (maxFontSize - minFontSize);
    const lineHeight = 1.05 + compressionRatio * 0.25;

    return {
      fontSize,
      lineHeight: Number(lineHeight.toFixed(2)),
    };
  };

  const getSubmittedTint = (item: SortableItem) => {
    if (!hasSubmitted) return undefined;

    return item.target === item.answer ? 'rgba(34, 197, 94, 0.26)' : 'rgba(239, 68, 68, 0.26)';
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    onSubmit?.();
  };

  const [items, setItems] = useState<SortableItem[]>([
    { id: 'item-1', target: 'middle', answer: 'safe', label: 'Email from your teacher asking you to bring PE gear tomorrow' },
    { id: 'item-2', target: 'middle', answer: 'unsafe', label: 'Text from unknown number with tracking link for a parcel' },
    { id: 'item-3', target: 'middle', answer: 'unsafe', label: 'A random person you don\'t know sends a friend request in a game' },
    { id: 'item-4', target: 'middle', answer: 'safe', label: 'After exchanging contact details in class a friend messages you' },
  ]);

  const middleItems = items.filter(i => i.target === 'middle');
  const leftItems = items.filter(i => i.target === 'safe');
  const rightItems = items.filter(i => i.target === 'unsafe');
  const allItemsSorted = middleItems.length === 0;

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (hasSubmitted) return;
        if (event.canceled) return;

        const sourceId = event.operation.source?.id;
        const targetId = event.operation.target?.id;

        if (!targetId) return;

        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === sourceId 
              ? { ...item, target: targetId as 'middle' | 'safe' | 'unsafe' } 
              : item
          )
        );
      }}
    >
      <div className={embedded ? "relative h-full bg-[#F7F5EE] overflow-auto" : "relative min-h-screen bg-[#F7F5EE]"}>
        <div className="relative py-4">
          <h1 className={`absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap ${headingTextClass}`}>Sort these out!</h1>
          <div className="absolute right-0 top-0">
          </div>
        </div>

        <div>
          <div className="flex justify-center items-start gap-8 mt-6">
            <div className="w-1/3 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <img
                  src={safeFace}
                  alt="Safe"
                  style={{
                    width: 148,
                    height: 148,
                    aspectRatio: '1 / 1',
                    background: `url(${safeFace}) lightgray -213px -807px / 1037.838% 691.892% no-repeat`,
                  }}
                />
                <h2 className={headingTextClass}>Safe</h2>
              </div>
              <SortBox id="safe">
                <div className="w-[504px] h-[575px] rounded-[20px] bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
                  <div className="flex h-full w-full flex-col items-center justify-start gap-4 py-4">
                    {leftItems.map(item => (
                      <Sortable key={item.id} id={item.id} disabled={hasSubmitted}>
                        <div
                          className={sortableCardClass}
                          style={{
                            backgroundColor: getSubmittedTint(item),
                            transition: 'background-color 240ms ease',
                          }}
                        >
                          <span
                            className="text-black text-center"
                            style={{
                              fontFamily: 'Holtwood One SC',
                              fontStyle: 'normal',
                              fontWeight: 400,
                              ...getSortableTextStyle(item.label),
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </Sortable>
                    ))}
                  </div>
                </div>
              </SortBox>
            </div>

            <div className="w-1/3 flex flex-col items-center self-center gap-2">
              {middleItems.map(item => (
                <Sortable key={item.id} id={item.id} disabled={hasSubmitted}>
                  <div
                    className={sortableCardClass}
                    style={{
                      backgroundColor: getSubmittedTint(item),
                      transition: 'background-color 240ms ease',
                    }}
                  >
                    <span
                      className="text-black text-center"
                      style={{
                        fontFamily: 'Holtwood One SC',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        ...getSortableTextStyle(item.label),
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                </Sortable>
              ))}
            </div>

            <div className="w-1/3 flex flex-col items-center">
              <div className="flex items-center gap-3">
                <img
                  src={unsafeFace}
                  alt="Unsafe"
                  style={{
                    width: 148,
                    height: 148,
                    aspectRatio: '1 / 1',
                    background: `url(${unsafeFace}) lightgray -213px -807px / 1037.838% 691.892% no-repeat`,
                  }}
                />
                <h2 className={headingTextClass}>Unsafe</h2>
              </div>
              <SortBox id="unsafe">
                <div className="w-[504px] h-[575px] rounded-[20px] bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]">
                  <div className="flex h-full w-full flex-col items-center justify-start gap-4 py-4">
                    {rightItems.map(item => (
                      <Sortable key={item.id} id={item.id} disabled={hasSubmitted}>
                        <div
                          className={sortableCardClass}
                          style={{
                            backgroundColor: getSubmittedTint(item),
                            transition: 'background-color 240ms ease',
                          }}
                        >
                          <span
                            className="text-black text-center"
                            style={{
                              fontFamily: 'Holtwood One SC',
                              fontStyle: 'normal',
                              fontWeight: 400,
                              ...getSortableTextStyle(item.label),
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </Sortable>
                    ))}
                  </div>
                </div>
              </SortBox>
            </div>
          </div>
        </div>

        {allItemsSorted && !hasSubmitted ? (
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-[#3B6D11] px-10 py-4 text-2xl font-bold text-white shadow-[0_12px_24px_rgba(0,0,0,0.22)] transition hover:bg-[#2f560d]"
            >
              Submit
            </button>
          </div>
        ) : null}
      </div>
    </DragDropProvider>
  )
}

export default QuestionSort;