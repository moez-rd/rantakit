import { ToolCard } from "@/components/blocks/ToolCard";
import { useT } from "@/i18n";
import { JOBS, TOOL_ICONS, useTools, type ToolId } from "./tools";

interface HomePageProps {
  onOpenTool: (id: ToolId) => void;
}

/** Every Tool, grouped by Job, on one scrolling page. Coming soon Tools follow the shipped ones. */
export function HomePage({ onOpenTool }: HomePageProps) {
  const { t } = useT();
  const tools = useTools();
  const groups = JOBS.map((job) => {
    const inJob = tools.filter((tool) => tool.job === job);
    return { job, tools: [...inJob.filter((tool) => !tool.comingSoon), ...inJob.filter((tool) => tool.comingSoon)] };
  }).filter((group) => group.tools.length > 0);

  return (
    <div className="flex flex-1 flex-col gap-9 px-12 pt-10 pb-12">
      <h1 className="sr-only">{t("nav.home")}</h1>

      <section aria-labelledby="home-all" className="flex flex-col gap-7">
        <h2 id="home-all" className="text-section">
          {t("home.all")}
        </h2>
        {groups.map(({ job, tools }) => (
          <div key={job} className="flex flex-col gap-3.5">
            <h3 className="font-semibold text-text-muted">{t(`job.${job}`)}</h3>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-x-4 gap-y-5">
              {tools.map(({ id, comingSoon }) => (
                <li key={id} className="flex">
                  <ToolCard
                    name={t(`tool.${id}`)}
                    description={t(`tool.${id}.description`)}
                    icon={TOOL_ICONS[id]}
                    comingSoon={comingSoon ? t("home.comingSoon") : undefined}
                    onPress={() => onOpenTool(id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
