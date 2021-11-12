import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar, FiUser } from "react-icons/fi";

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Link from "next/link";

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { dateFormat } from '../utils/dateFormat';
import { useState } from 'react';
import Head from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;

}

export default function Home({ postsPagination, preview }: HomeProps) {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function loadMorePosts() {
    if(nextPage) {
      const postsPagination = await fetch(nextPage)
      .then(res => res.json())
      .then(res => {
        return {
          next_page: res.next_page,
          results: res.results.map(post => {
            return {
              uid: post.uid,
              first_publication_date: post.first_publication_date,
              data: {
                title: post.data.title,
                subtitle: post.data.subtitle,
                author: post.data.author
              }
            };
          })
        };
      });

      setNextPage(postsPagination.next_page);
      setPosts(posts => [...posts, ...postsPagination.results]);
    };
  };

  return (
    <>
      <Head>
        <title>Spacetraveling</title>
      </Head>
      <main className={`${commonStyles.page} ${styles.container}`}>
        <Header/>
        {
          posts.map(post => {
            const { uid, first_publication_date: publicationDate } = post; 
            const { title, subtitle, author } = post.data;

            //So estava funcionando o teste do Jest quando eu deixava aqui
            const date = dateFormat(new Date(publicationDate));

            return (
              <Link key={uid} href={`/post/${uid}`}>
                <a>
                  <h1>{title}</h1>
                  <p>{subtitle}</p>
                  <div className={commonStyles.info}>
                    <FiCalendar/>
                    <time>{date}</time>
                    <FiUser/>
                    <p>{author}</p>
                  </div>
                </a>
              </Link>
            );
          })
        }
        { nextPage && <button type="button" onClick={loadMorePosts}>
          Carregar mais posts
        </button> }
        {
          preview && (
            <aside className={commonStyles.preview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )
        }
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ preview = false, previewData }) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at("document.type", "post"),
    {
      pageSize: 4,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author
            }
          };
        })
      },
      preview
    } as HomeProps
  };
};