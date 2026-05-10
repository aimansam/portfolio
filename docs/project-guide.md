# Project Guide

This guide explains how to add and maintain portfolio projects.

Project cards are powered by `content/site/projects.json`. Detailed project pages live in `project-pages/`. Project images live in `assets/images/`.

## Add A Project Card

Open `content/site/projects.json` and add a new object inside `projects.items`.

Example:

```json
{
  "category": "infrastructure",
  "image": "./assets/images/my-project.png",
  "tags": ["Infrastructure", "Security"],
  "title": "My New Security Lab",
  "description": "A short description of what the project does, what tools were used, and what security skill it demonstrates.",
  "href": "./project-pages/my-new-security-lab.html"
}
```

Field notes:

- `category`: Controls which filter button shows the project.
- `image`: Path to the card image from the site root.
- `tags`: Short labels displayed on the project card.
- `title`: Project card title.
- `description`: Short project summary. Keep it specific and outcome-focused.
- `href`: Link to the detailed project page.

## Add A Category

Categories must be listed in `projects.filters` before they can be used by project items.

Example:

```json
{ "id": "web", "label": "Web" }
```

Then use the same `id` in the project card:

```json
"category": "web"
```

Current categories:

- `infrastructure`
- `hardware`
- `wireless`

Useful future categories:

- `web`
- `active-directory`
- `ctf`
- `automation`

## Add Project Images

Put project images in `assets/images/`.

Recommended naming:

```text
assets/images/my-new-security-lab-cover.png
assets/images/my-new-security-lab-diagram.png
assets/images/my-new-security-lab-dashboard.png
```

Use compressed images where possible. Prefer `.webp` for screenshots and large visual assets when quality is acceptable.

## Add A Detail Page

Copy the existing template:

```sh
cp project-pages/project-template.html project-pages/my-new-security-lab.html
```

Edit the copied page:

1. Update the `<title>` and meta description.
2. Update the navbar title/contact details if needed.
3. Replace the project title and intro text.
4. Replace the header image.
5. Add project background, goals, tools, architecture, and outcomes.
6. Replace gallery images and captions.
7. Remove leftover placeholder comments or template text.

## Suggested Project Page Structure

Use this structure for security projects:

1. **Overview**: What the project is and why it exists.
2. **Goal**: What skill, workflow, or environment it demonstrates.
3. **Stack / Tools**: Tools, platforms, hardware, and services used.
4. **Architecture**: Network, components, or flow diagram.
5. **Implementation**: Key build steps or design decisions.
6. **Security Value**: What the project proves or practices.
7. **Lessons Learned**: What you would repeat or improve.
8. **Related Links**: Blog posts, GitHub repos, reports, or demos.

## Preview Locally

Build and serve the site with Docker:

```sh
docker compose up -d --build
```

Open the portfolio:

```text
http://localhost:5200/
```

Open a project page:

```text
http://localhost:5200/project-pages/my-new-security-lab.html
```

## Publish

After reviewing locally:

```sh
git add content/site/projects.json project-pages/my-new-security-lab.html assets/images/my-new-security-lab-*.png
git commit -m "Add my new security lab project"
git push origin main
```

## Quality Checklist

- Project card image loads correctly.
- Project filter works for the selected category.
- Project title and description are specific.
- Detail page has no template placeholder text.
- Images have useful captions.
- Page works on mobile width.
- Related blog posts or GitHub links are included when available.
- Local Docker preview works before pushing.

## Recommended Improvements

- Replace `project-template.html` placeholder branding with your portfolio branding.
- Add a cleaner reusable project page layout for security projects.
- Add optional fields in `projects.json`, such as `featured`, `links`, and `status`.
- Add related blog links from project pages to writeups or methodology notes.
- Add more project categories for web, Active Directory, CTF, and automation work.