export const PageState = ({ title, description }: { title: string; description: string }) => (
  <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center px-6 text-center">
    <div className="mb-6 h-px w-16 bg-accent/60" />
    <h2 className="font-display text-3xl text-foreground">{title}</h2>
    <p className="mt-4 font-body text-sm leading-7 text-muted-foreground">{description}</p>
  </div>
);
