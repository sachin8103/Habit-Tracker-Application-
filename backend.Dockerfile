FROM eclipse-temurin:17-jdk

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl netcat-openbsd dnsutils && rm -rf /var/lib/apt/lists/*

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline

COPY src ./src
RUN ./mvnw -q package -DskipTests

EXPOSE 8080

CMD ["bash", "-lc", "until getent hosts mysql >/dev/null 2>&1 && nc -z mysql 3306; do echo 'Waiting for MySQL...'; sleep 2; done; echo 'MySQL is reachable; starting Spring Boot...'; exec java -jar target/*.jar"]
