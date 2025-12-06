import { FC } from "react";

interface Props {
  type?: string;
}

const WordTypeBadge: FC<Props> = ({ type }) => {
  if (!type) return null;

  const label = type.toLowerCase().trim();
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200"; 

  if (label.includes("noun")) {
    colorClass = "bg-blue-50 text-blue-600 border-blue-200";
  } else if (label.includes("verb") && !label.includes("adverb")) {
    colorClass = "bg-green-50 text-green-600 border-green-200";
  } else if (label.includes("adj")) {
    colorClass = "bg-amber-50 text-amber-600 border-amber-200";
  } else if (label.includes("adv")) {
    colorClass = "bg-orange-50 text-orange-600 border-orange-200";
  } else if (label.includes("idiom") || label.includes("phrase")) {
    colorClass = "bg-purple-50 text-purple-600 border-purple-200";
  }

  return (
    <span
      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${colorClass} inline-block align-middle ml-2 tracking-wide`}
    >
      {label}
    </span>
  );
};

export default WordTypeBadge;