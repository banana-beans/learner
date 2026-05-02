// ============================================================
// Master lesson registry
// ============================================================

import { pythonBasicsLessons } from "./python-basics";
import { pythonControlFlowLessons } from "./python-control-flow";
import { pythonDataStructuresLessons } from "./python-data-structures";
import { pythonFunctionsLessons } from "./python-functions";
import { pythonOOPLessons } from "./python-oop";
import { pythonAdvancedLessons } from "./python-advanced";
import { typescriptLessons } from "./typescript";
import { reactLessons } from "./react";
import { dsaLessons } from "./dsa";
import { csharpLessons } from "./csharp";
import { databasesLessons } from "./databases";
import { systemsDesignLessons } from "./systems-design";
import { networkingLessons } from "./networking";
import { securityLessons } from "./security";
import { devopsLessons } from "./devops";
import type { LessonContent } from "./python-basics";

const allLessons: Record<string, LessonContent> = {
  ...pythonBasicsLessons,
  ...pythonControlFlowLessons,
  ...pythonDataStructuresLessons,
  ...pythonFunctionsLessons,
  ...pythonOOPLessons,
  ...pythonAdvancedLessons,
  ...typescriptLessons,
  ...reactLessons,
  ...dsaLessons,
  ...csharpLessons,
  ...databasesLessons,
  ...systemsDesignLessons,
  ...networkingLessons,
  ...securityLessons,
  ...devopsLessons,
};

export function getLesson(nodeId: string): LessonContent | undefined {
  return allLessons[nodeId];
}

export type { LessonContent };
