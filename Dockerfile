FROM quay.io/Teddytech1/TEDDY-XMD:latest

WORKDIR /root/teddy-xmd

RUN git clone https://github.com/Teddytech1/TEDDY-XMD . && \
    npm install

EXPOSE 5000

CMD ["npm", "start"]
