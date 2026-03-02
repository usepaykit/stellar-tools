// For plain CSS files imported for side effects (e.g. './globals.css')
declare module "*.css" {
  const css: string;
  export default css;
}