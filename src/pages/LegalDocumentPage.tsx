
import React from 'react';
import { LegalDocument } from '../types';
import { marked } from 'marked';

interface LegalDocumentPageProps {
  document: LegalDocument;
}

const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({ document }) => {
  // A simple and safe way to render Markdown content
  const getMarkdownText = () => {
    const rawMarkup = marked.parse(document.content || 'No content available.');
    return { __html: rawMarkup as string };
  };

  return (
    <div className="bg-hav-cream py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-hav-orange-900 text-center mb-4">
            {document.title}
          </h1>
          <p className="text-center text-sm text-gray-500 mb-12">
            Last updated on {new Date(document.updated_at).toLocaleDateString()}
          </p>
          <div
            className="prose lg:prose-lg max-w-none text-hav-brown prose-headings:text-hav-orange-900 prose-headings:font-serif prose-strong:text-hav-brown prose-a:text-hav-orange-600 hover:prose-a:text-hav-orange-800"
            dangerouslySetInnerHTML={getMarkdownText()}
          />
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentPage;
