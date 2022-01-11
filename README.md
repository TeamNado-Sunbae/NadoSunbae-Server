# 나도선배 NadoSunbae - Server
 
<div>  
 <img width="100" alt="Frame 115" src="https://user-images.githubusercontent.com/58043306/148918367-20e69972-aeed-43c9-bcaf-c301483e15f5.png">

</div>

### 제2전공생을 위한 학과 후기, 전공 정보 공유 플랫폼 "나도선배"

> 아는 선배 없어도 괜찮아. 우리 같이 서로의 선배가 되어주자! <br>
> <strong>나도선배</strong>는 후기와 과방을 통해 인적 네트워크를 제공합니다.

> SOPT 29th APPJAM <br>
> 프로젝트 기간: 2021.12.18 ~ 2022.01.22
<br>

### 📋 IA  
![nadosunbaeIA](https://user-images.githubusercontent.com/58043306/148923393-80a1f7ce-e6d2-4f48-87ea-4fbdcd843a70.jpeg)
<br>
<br>

### 📚 API 명세서
[명세서 보기](https://nadosunbae.notion.site/API-2053bf57f1284ccba2916b80a36bf2d8)
<br>
<br>

### 🦴 ERD
<img width="788" alt="nadosunbaeERD" src="https://user-images.githubusercontent.com/58043306/148933131-84df0aaf-cdf6-4b05-b6a1-727585a047e7.png">
<br>

### 📌 Branch Strategy

<details>
<summary>Git Workflow</summary>
<div markdown="1">       

```
 1. local - feature에서 각자 기능 작업
 2. 작업 완료 후 remote - develop에 PR
 3. 코드 리뷰 후 Confirm 받고 Merge
 4. remote - develop 에 Merge 될 때 마다 모든 팀원 remote - develop pull 받아 최신 상태 유지
 ```

</div>
</details>

| Branch Name | 설명 |
| :---: | :-----: |
| main | 초기 세팅 존재 |
| develop | 모든 기능 merge 브랜치 |
| juhyeon | 주현 로컬 브랜치 |
| eunji | 은지 로컬 브랜치 |
| seol | 지원 로컬 브랜치 |
| localdevelop_feature/#issue | 각자 기능 추가 브랜치 |
<br>

### 📌 Commit Convention

**[태그] 내용** 의 형태로 작성 <br>
ex) [FEAT] implement postGET

<details>
<summary>Tags</summary>
<div markdown="1">   
  
| 태그 이름| 설명 |
| :--: | :-----: |
| CHORE | 빌드 태스트 업데이트, 패키지 매니저를 설정하는 경우(프로덕션 코드 변경 X) |
| FEAT | 새로운 기능을 추가하는 경우 |
| !HOTFIX | 급하게 치명적인 버그를 고쳐야하는 경우 |
| FIX | 버그, 오류 해결 |
| STYLE | 코드 포맷 변경, 세미 콜론 누락, 코드 수정이 없는 경우 |
| DELETE | 쓸모없는 코드 삭제 |
| DOCS | README나 WIKI 등의 문서 개정 |
| MOVE | 프로젝트 내 파일이나 코드의 이동 |
| RENAME | 파일 이름 변경 |
| REFACTOR | 프로덕션 코드 리팩토링 |
| COMMENT | 필요한 주석 추가 및 변경 |
| TEST | 테스트 추가, 테스트 리팩토링(프로덕션 코드 변경 X)
  
</div>
</details>
<br>

### 📌 Issue, PR Convention

<div markdown="1">       
      
 
* 변수나 폴더명은 영어로 쓰되, 설명은 한글로 작성
<details>
<summary>Issue</summary>
<div mardown="1">
  [영어 대문자] 내용
</div>
</details>
<details>
<summary>PR</summary>
<div mardown="1">
  [영어 대문자] #이슈 번호 - 해당 이슈 내용 <br>
  * 이슈와 내용이 동일할 필요는 없음 <br>
  * 이슈 번호는 동일 해야 함
</div>
</details>
 
</div>
<br>

### 📌 Coding Convention

<details>
<summary>변수명</summary>   
<div markdown="1">       
      
 
 1. Camel Case 사용 
   - lower Camel Case
 2. 함수의 경우 동사+명사 사용 
   - ex) getInformation()
 3. 길이는 20자로 제한한다. 
   - 부득이한 경우 팀원과의 상의를 거친다.
 4. flag로 사용 되는 변수는 조동사 + flag 종류로 구성 
   - ex) isNumber
 5. 약어는 되도록 사용하지 않는다.
 
</div>
</details>

<details>
<summary>주석</summary>
<div markdown="1">       

 1. 한줄 주석은 // 를 사용한다.
 2. 그 이상은 /** */ 를 사용한다.
 3. 함수 설명 주석은 2번을 사용한다.
 
</div>
</details>

<details>
<summary>Bracket</summary>
<div markdown="1">       

 ``` javascript
 // 한줄 if 문 - 여러 줄로 작성
  if(trigger) {
    return;
  }
 ```
 ``` javascript 
 // 괄호 사용 한칸 띄우고 사용한다.
  if (left == true) {
     return;
  }
 ```
 ``` javascript 
 // 띄어쓰기
  if (a == 5) { // 양쪽 사이로 띄어쓰기
     return;  
  }
 ```
 
</div>
</details>

<details>
<summary>비동기 함수의 사용</summary>
<div markdown="1">       

 1. async, await 함수 사용을 지향한다.
 2. Promise 사용은 지양한다.
 
</div>
</details>
<br>

### 🗂 Foldering
```markdown
|-📋 firebaserc
|-📋 firebase.json
|-📋 .gitignore
|-📁 functions_
               |- 📋 index.js
               |- 📋 package.json
               |- 📋 .gitignore
               |- 📋 .env
               |- 📁 api_ 
               |         |- 📋 index.js
               |         |- 📁 routes_
               |                      |- 📋 index.js
               |
               |- 📁 config_ 
               |            |- 📋 dbConfig.js
               |            |- 📋 firebaseClient.js
               |
               |- 📁 constants_
               |               |- 📋 jwt.js
               |               |- 📋 responseMessage.js
               |               |- 📋 statusCode.js
               |
               |- 📁 db_ 
               |        |- 📋 db.js
               |        |- 📋 index.js
               |
               |- 📁 lib_
               |         |- 📋 convertSnakeToCamel.js
               |         |- 📋 jwtHandler.js
               |         |- 📋 util.js
               |
               |- 📁 middlewares_
                                 |- 📋 auth.js
               
```
<br>

### 🧩 Role
| Name | Role |
| :---: | :-----: |
| juhyeon | DB 설계, API 명세서 작성, README 작성 |
| eunji | DB 설계, API 명세서 작성 |
| seol | DB 설계, API 명세서 작성, 초기 세팅 |
<br>

### 💻 Current Progress
(추가 예정)
<br>

### 👩🏻‍💻 Developers   
| 변주현 | 김은지 | 설지원 |
| :---: | :---: | :---: |
|<img src="https://user-images.githubusercontent.com/58043306/148938342-8ebcff6f-3ea1-49d9-987f-8a6d446ff51f.png" width="150px" height="150px" />|<img src ="https://user-images.githubusercontent.com/58043306/148953655-5e710c6d-07e6-4ee8-a3a0-76bbbbcd8dd3.png" width = "150px" height="150px" />|<img src ="https://user-images.githubusercontent.com/58043306/148938443-f8e66386-0dc4-4889-9168-2c3b4d8c4776.png" width = "150px" height="150px" />|
|[wngus4296](https://github.com/wngus4296)|[eunji8784](https://github.com/eunji8784)|[seoljiwon](https://github.com/seoljiwon)| 
