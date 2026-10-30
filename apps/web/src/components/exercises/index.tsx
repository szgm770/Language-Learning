"use client";

import type { Exercise } from "@lingo/content-schema";
import type { Response } from "@lingo/engine";
import { Dialogue } from "./Dialogue";
import { DialogueGap } from "./DialogueGap";
import { Dictation } from "./Dictation";
import { FillBlank } from "./FillBlank";
import { Learn } from "./Learn";
import { ListeningChoice } from "./ListeningChoice";
import { MatchPairs } from "./MatchPairs";
import { MultipleChoice } from "./MultipleChoice";
import { Reading } from "./Reading";
import { SpeakRepeat } from "./SpeakRepeat";
import { Tip } from "./Tip";
import { Translate } from "./Translate";
import type { ExerciseContext } from "./types";
import { WordBank } from "./WordBank";

export type { ExerciseContext };

export function ExerciseView(props: {
  ex: Exercise;
  ctx: ExerciseContext;
  locked: boolean;
  onChange: (r: Response | null) => void;
}) {
  const { ex, ...rest } = props;
  switch (ex.type) {
    case "learn":
      return <Learn ex={ex} {...rest} />;
    case "dialogue":
      return <Dialogue ex={ex} {...rest} />;
    case "dialogue_gap":
      return <DialogueGap ex={ex} {...rest} />;
    case "tip":
      return <Tip ex={ex} {...rest} />;
    case "reading":
      return <Reading ex={ex} {...rest} />;
    case "multiple_choice":
      return <MultipleChoice ex={ex} {...rest} />;
    case "listening_choice":
      return <ListeningChoice ex={ex} {...rest} />;
    case "match_pairs":
      return <MatchPairs ex={ex} {...rest} />;
    case "word_bank":
      return <WordBank ex={ex} {...rest} />;
    case "fill_blank":
      return <FillBlank ex={ex} {...rest} />;
    case "translate":
      return <Translate ex={ex} {...rest} />;
    case "dictation":
      return <Dictation ex={ex} {...rest} />;
    case "speak_repeat":
      return <SpeakRepeat ex={ex} {...rest} />;
  }
}
