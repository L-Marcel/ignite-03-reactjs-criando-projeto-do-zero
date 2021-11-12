import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { dateFormat } from '../../utils/dateFormat';
import styles from './post.module.scss';
import Prismic from "@prismicio/client";
import { RichText } from "prismic-dom";

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post() {
  return (
    <div></div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at("document.type", "post"),
    { orderings: '[document.first_publication_date]' }
  );

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid
        }
      };
    }),
    fallback: true
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID("post", String(slug), {});
  const post = response.data;

  console.log(post.content[0].body);

  return {
    props: {
      post: {
        first_publication_date: dateFormat(new Date(response.first_publication_date)),
        data: {
          title: post.title,
          subtitle: post.subtitle,
          author: post.author,
          banner: {
            url: post.banner.url
          },
          content: post.content.map(content => {
            return {
              ...content,
              body: {}
            };
          })
        }
      }
    } as PostProps,
    revalidate: 60 * 60
  };
};
