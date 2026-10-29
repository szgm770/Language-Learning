import type { Course, Unit } from "./schema";

/**
 * Cross-reference checks that a schema alone cannot express.
 * Returns human-readable problems; an empty array means the unit is valid.
 */
export function validateUnitReferences(unit: Unit): string[] {
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
      if (exerciseIds.has(ex.id)) problems.push(`duplicate exercise id "${ex.id}"`);
      exerciseIds.add(ex.id);
      for (const ref of ex.lexemes) {
        if (!lexemeIds.has(ref)) problems.push(`exercise "${ex.id}" points to unknown lexeme "${ref}"`);
      }
    }
  }
  return problems;
}

export function validateCourse(course: Course, units: Unit[]): string[] {
  const problems: string[] = [];
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
