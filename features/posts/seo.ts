import "server-only";

import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { canonicalUrl, siteConfig } from "@/lib/seo/siteConfig";
import { POST_TYPE_LABELS, POST_TYPE_TO_ROUTE } from "./constants";
import { getPublicPostById } from "./queries";
import type { PostDetailView, PostType } from "./types";

const POST_DETAIL_FALLBACK_DESCRIPTION: Record<PostType, string> = {
  job: "OpenAA 纽约华人招聘详情，查看岗位、地区、薪资和联系方式。",
  housing: "OpenAA 纽约华人房屋详情，查看租房、求租、地区、价格和联系方式。",
  marketplace: "OpenAA 纽约华人二手市场详情，查看闲置、求购、价格和联系方式。",
  service: "OpenAA 纽约华人本地服务详情，查看服务范围、地区、价格和联系方式。",
};

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function postDescription(post: PostDetailView, type: PostType) {
  const detailParts = [post.area, post.categoryValue, post.priceDisplay].filter(Boolean);
  const body = compactText(post.description || post.body || "");
  const detailText = detailParts.length > 0 ? `${detailParts.join(" · ")}。` : "";
  const description = compactText(`${detailText}${body}`) || POST_DETAIL_FALLBACK_DESCRIPTION[type];
  return truncate(description, 160);
}

function postTitle(post: PostDetailView, type: PostType) {
  const suffix = POST_TYPE_LABELS[type];
  return post.title.includes(suffix) ? post.title : `${post.title} - ${suffix}`;
}

export async function generatePostDetailMetadata(id: string, type: PostType): Promise<Metadata> {
  const result = await getPublicPostById(id, type);
  const post = result.data;

  if (!post) {
    return buildPageMetadata({
      title: `${POST_TYPE_LABELS[type]}详情`,
      description: POST_DETAIL_FALLBACK_DESCRIPTION[type],
      path: POST_TYPE_TO_ROUTE[type],
      noIndex: true,
    });
  }

  const title = postTitle(post, type);
  const description = postDescription(post, type);
  const url = canonicalUrl(post.href);
  const image = post.imageUrl || "/og-default.png";

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
      publishedTime: post.publishedAt ?? post.createdAt,
      modifiedTime: post.sourceRecord?.updated_at ?? post.publishedAt ?? post.createdAt,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
