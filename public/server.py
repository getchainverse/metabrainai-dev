from flask import Flask,request,jsonify
from flask_cors import CORS
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import GPT4All
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.document_loaders import WebBaseLoader
from pdf2image import convert_from_path
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

@app.route('/embedde', methods=["POST"])
def embedde():
    try:
        message = request.json["message"];
        isType = request.json["isType"];
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1024,
            chunk_overlap=64
        )
        if request.json["isType"] == "doc" :
            content = request.json["docsContent"];
            loader = PyPDFLoader(content)
            documents = loader.load_and_split()
            texts = text_splitter.split_documents(documents)
        if request.json["isType"] == "web" :
            root_url_parts = urlparse(request.json["docsContent"])
            if root_url_parts.scheme != "https" and root_url_parts.scheme != "http":
                return jsonify({'message': 'Invalid Url'}), 400
            try:
                loader = WebBaseLoader(request.json["docsContent"])
                content = loader.load();
            except Exception as e:
                return jsonify({'error': "Please check the content"}), 400
            print(content);
            texts=text_splitter.split_documents(content)
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        db = Chroma.from_documents(texts, embeddings, persist_directory="db")
        llm = GPT4All(
            model="./ggml-falcon-j-v1.3-groovy.bin",
            # n_ctx=1000,
            backend="gptj",
            verbose=False
        )
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=db.as_retriever(search_kwargs={"k": 3}),
            return_source_documents=True,
            verbose=False,
        )
        res = qa(f"{message}")

        response_body = res["result"];

        return response_body
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)