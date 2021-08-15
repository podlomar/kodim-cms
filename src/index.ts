export interface Resource {
  title: string;
}

export const sampleResource = (title: string): Resource => ({
  title: title,
});
