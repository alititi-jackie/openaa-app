import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsDetail } from "@/components/news/NewsDetail";
import { getNewsBySlug } from "@/features/news/queries";
import { NEWS_DEFAULT_DESCRIPTION } from "@/features/news/constants";
import { canonicalUrl, siteConfig } from "@/lib/seo/siteConfig";

export const dynamic = "force-dynamic";

type NewsDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getNewsBySlug(slug);
  const post = result.data;

  if (!post) {
    return {
      title: "新闻详情",
      description: NEWS_DEFAULT_DESCRIPTION,
      robots: { index: false, follow: false },
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || NEWS_DEFAULT_DESCRIPTION;
  const url = canonicalUrl(`/news/${post.slug}`);
  const images = post.coverImageUrl ? [post.coverImageUrl] : ["/og-default.png"];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "article",
      locale: siteConfig.locale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const result = await getNewsBySlug(slug);

  if (!result.data) {
    notFound();
  }

  const post = result.data;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    articleSection: post.categoryName,
    mainEntityOfPage: canonicalUrl(`/news/${post.slug}`),
    url: canonicalUrl(`/news/${post.slug}`),
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: canonicalUrl("/"),
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: canonicalUrl("/") },
      { "@type": "ListItem", position: 2, name: "新闻", item: canonicalUrl("/news") },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl(`/news/${post.slug}`) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <NewsDetail post={post} />
    </>
  );
}
