/** 프로젝트 쇼케이스 화면 목 데이터 타입. 실제 프로젝트 API가 생기기 전까지 정적/목업 콘텐츠에 쓴다. */
export type ProjectSemester = "2025 Fall" | "2025 Spring" | "2024 Fall";

export interface Project {
  id: string;
  team: string;
  semester: ProjectSemester;
  title: string;
  description: string;
  gradient: string;
  techStack: string[];
  codeUrl: string;
  demoUrl: string;
}
