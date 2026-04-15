interface PageCard {
  icon: string
  title: string
  desc: string
  badge?: "playable" | "wip" | "tool"
}

const modules = import.meta.glob<PageCard>("/src/apps/*/page.json", {
  eager: true,
  import: "default",
})

const pages = Object.entries(modules).map(([path, data]) => {
  const id = path.match(/^\/src\/apps\/([^/]+)\/page\.json$/)?.[1]
  return { id, ...(data as PageCard) }
})

function badgeText(badge?: string) {
  switch (badge) {
    case "playable":
      return "可玩"
    case "wip":
      return "开发中"
    case "tool":
      return "工具"
    default:
      return ""
  }
}

const grid = document.querySelector(".nav-grid")
if (grid) {
  pages.forEach((p) => {
    if (!p.id) return
    const a = document.createElement("a")
    a.href = `./pages/${p.id}.html`
    a.className = "nav-card"
    a.innerHTML = `
      <div class="icon">${p.icon}</div>
      <div class="title">${p.title}</div>
      <div class="desc">${p.desc}</div>
      <span class="badge ${p.badge === "wip" ? "wip" : ""}">${badgeText(p.badge)}</span>
    `
    grid.appendChild(a)
  })
}
