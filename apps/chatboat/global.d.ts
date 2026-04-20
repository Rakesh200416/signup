// Declare CSS files as valid side-effect imports for TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
