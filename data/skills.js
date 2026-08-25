const D = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

export function skillIcon(slug) {
  return `${D}/${slug}/${slug}-original.svg`;
}

export const SKILL_CATALOG = [
  { name: "Python", slug: "python" },
  { name: "C++", slug: "cplusplus" },
  { name: "C", slug: "c" },
  { name: "HTML", slug: "html5" },
  { name: "CSS", slug: "css3" },
  { name: "JavaScript", slug: "javascript" },
  { name: "TypeScript", slug: "typescript" },
  { name: "React", slug: "react" },
  { name: "Node.js", slug: "nodejs" },
  { name: "Java", slug: "java" },
  { name: "Tailwind", slug: "tailwindcss" },
  { name: "Git", slug: "git" },
  { name: "Docker", slug: "docker" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "MySQL", slug: "mysql" },
  { name: "Figma", slug: "figma" },
  { name: "PHP", slug: "php" },
  { name: "Swift", slug: "swift" },
  { name: "Kotlin", slug: "kotlin" },
  { name: "Rust", slug: "rust" },
];
