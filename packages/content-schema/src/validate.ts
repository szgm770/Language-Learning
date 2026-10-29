import type { Course, Unit } from "./schema";

/**
 * Cross-reference checks that a schema alone cannot express.
 * Returns human-readable problems; an empty array means the unit is valid.
 */
export function validateUnitReferences(unit: Unit, opts: { courseWide?: boolean } = {}): string[] {
  const problems: string[] = [];
  const lexemeIds = new Set<string>();
  for (const lx of unit.vocabulary) {
    if (lexemeIds.has(lx.id)) problems.push(`duplicate lexeme id "${lx.id}"`);
    lexemeIds.add(lx.id);
  }
  const grammarIds = new Set(unit.grammar.map((g) => g.id));
  const lessonIds = new Set<string>();
  const exerciseIds = new Set<string>();

  for (const lesson of unit.lessons) {
    if (lessonIds.has(lesson.id)) problems.push(`duplicate lesson id "${lesson.id}"`);
    lessonIds.add(lesson.id);
    if (lesson.grammar && !grammarIds.has(lesson.grammar)) {
      problems.push(`lesson "${lesson.id}" points to unknown grammar "${lesson.grammar}"`);
    }
    for (const ex of lesson.exercises) {
      if (ex.type === "learn" && !lexemeIds.has(ex.lexeme)) problems.push(`learn card "${ex.id}" points to unknown lexeme "${ex.lexeme}"`);
      if (exerciseIds.has(ex.id)) problems.push(`duplicate exercise id "${ex.id}"`);
      exerciseIds.add(ex.id);
      // Practising words from earlier units is fine; validateCourse checks them course-wide.
      if (!opts.courseWide) {
        for (const ref of ex.lexemes) {
          if (!lexemeIds.has(ref)) problems.push(`exercise "${ex.id}" points to unknown lexeme "${ref}"`);
        }
      }
    }
  }
  return problems;
}

/**
 * Teaching order: a word must be introduced (learn card, or listed in an earlier lesson's
 * exercises) before a graded exercise of a `new` lesson relies on it.
 */
export function validateTeachingOrder(units: Unit[]): string[] {
  const problems: string[] = [];
  const known = new Set<string>();
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      for (const ex of lesson.exercises) {
        if (ex.type === "learn") {
          known.add(ex.lexeme);
          continue;
        }
        if (lesson.kind !== "new" || ex.type === "dialogue" || ex.type === "tip") continue;
        for (const lx of ex.lexemes) {
          if (!known.has(lx)) problems.push(`"${ex.id}" practises "${lx}" before it was taught (add a learn card first)`);
        }
      }
      // Anything practised in a finished lesson counts as taught from then on.
      for (const ex of lesson.exercises) for (const lx of ex.lexemes) known.add(lx);
    }
  }
  return problems;
}

export function validateCourse(course: Course, units: Unit[]): string[] {
  const problems: string[] = [];
  const speakers = new Set(course.characters.map((c) => c.id));
  for (const unit of units)
    for (const lesson of unit.lessons)
      for (const ex of lesson.exercises)
        if (ex.type === "dialogue" || ex.type === "dialogue_gap")
          for (const line of ex.lines)
            if (!speakers.has(line.speaker)) problems.push(`"${ex.id}": unknown speaker "${line.speaker}"`);
  const allLexemes = new Set(units.flatMap((u) => u.vocabulary.map((l) => l.id)));
  for (const unit of units)
    for (const lesson of unit.lessons)
      for (const ex of lesson.exercises)
        for (const ref of ex.lexemes)
          if (!allLexemes.has(ref)) problems.push(`exercise "${ex.id}" points to unknown lexeme "${ref}"`);
  const found = new Set(units.map((u) => u.id));
  for (const id of course.units) if (!found.has(id)) problems.push(`course lists unit "${id}" but it was not found`);
  // Ids must be unique across the whole course, because progress is stored by id.
  const seen = new Map<string, string>();
  const lexemes = new Map<string, string>();
  for (const unit of units) {
    // Review cards are keyed by course + lexeme id, so a word id may be defined only once per course.
    for (const lx of unit.vocabulary) {
      const prev = lexemes.get(lx.id);
      if (prev && prev !== unit.id) problems.push(`lexeme "${lx.id}" is defined in both "${prev}" and "${unit.id}"`);
      lexemes.set(lx.id, unit.id);
    }
    for (const lesson of unit.lessons) {
      for (const id of [lesson.id, ...lesson.exercises.map((e) => e.id)]) {
        const prev = seen.get(id);
        if (prev && prev !== unit.id) problems.push(`id "${id}" is used in both "${prev}" and "${unit.id}"`);
        seen.set(id, unit.id);
      }
    }
  }
  return problems;
}
