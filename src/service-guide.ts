type Guide = { bring: string; example: string; outcome: string; boundary: string }

export const serviceGuides: Record<string, Guide> = {
  'academic-tutoring': {
    bring: 'Share your current level, module and one topic you find difficult. A practice question or an example of your working helps us see where to start.',
    example: 'If you can follow an algebra solution in class but get stuck on your own, start by explaining where your method changes. Work through a comparable question, then try a fresh example.',
    outcome: 'A clearer explanation of the concept, feedback on your reasoning and a specific way to practise it independently.',
    boundary: 'Tutoring supports your learning. Assessed work remains your own.'
  },
  'assignment-guidance-and-academic-support': {
    bring: 'Bring the assessment brief, marking criteria and any notes or outline you have started.',
    example: 'For a brief asking you to evaluate two approaches, identify the criteria for comparison and sketch how your own evidence could support a judgement.',
    outcome: 'A workable plan, clearer priorities and questions you can use to review your own draft.',
    boundary: 'We can discuss your approach and give feedback. You write and submit the work.'
  },
  'proofreading-and-editing': {
    bring: 'Share a draft sample, the intended audience and any editing restrictions or style guide.',
    example: 'Review a paragraph where a reader may lose track of the main claim. Compare possible edits for sentence flow, terminology and punctuation.',
    outcome: 'Clear feedback on readability and a checklist of recurring issues you can apply to the rest of the document.',
    boundary: 'Confirm what your institution permits before sharing assessed work. Any suggestions should preserve your authorship and meaning.'
  },
  'academic-research-support': {
    bring: 'Share your provisional question, available sources or data, and any access, ethics or time constraints.',
    example: 'Compare two ways of investigating a broad topic. Check what evidence each would need and narrow the question to something you can realistically answer.',
    outcome: 'A clearer research question and a practical list of evidence, decisions and next steps.',
    boundary: 'Research design guidance supports your decisions. You collect, interpret and report your own evidence.'
  },
  'dissertation-and-thesis-guidance': {
    bring: 'Share your programme guidance, stage of the project and the chapter or decision holding you up.',
    example: 'Review a draft chapter outline against the research question. Identify where it needs more evidence, a clearer link to the methods or a narrower scope.',
    outcome: 'A chapter-level action plan with priorities for your next independent writing session.',
    boundary: 'We discuss structure and give feedback on your work. We do not produce a dissertation or thesis for submission.'
  },
  'research-proposal-guidance': {
    bring: 'Bring the proposal criteria, your initial question and any known restrictions on access or recruitment.',
    example: 'Take a draft question and compare possible methods against feasibility, ethics and the kind of answer each could support.',
    outcome: 'A reasoned link between the question, proposed evidence and method, with limitations to address.',
    boundary: 'Your institution makes decisions about ethics and approval. You prepare and submit the proposal.'
  },
  'literature-review-support': {
    bring: 'Bring your review question, a small sample of sources and any search terms you have tried.',
    example: 'Compare two papers that reach different conclusions. Map their methods, populations and assumptions before deciding how to discuss them together.',
    outcome: 'An approach to grouping sources by themes or debates and turning your notes into a synthesis.',
    boundary: 'You read and interpret the sources. Guidance focuses on your search, comparison and structure.'
  },
  'referencing-and-citation-assistance': {
    bring: 'Bring the required referencing guide and examples of sources you are unsure how to cite.',
    example: 'Work through a journal article and a source with an unusual author or publication format. Cross-check each in-text citation with its reference entry.',
    outcome: 'A consistent approach to checking attribution, missing details and recurring formatting issues.',
    boundary: 'You remain responsible for verifying that sources and citations are accurate before submitting.'
  },
  'academic-writing-coaching': {
    bring: 'Share a short passage you wrote, its purpose and any feedback you want to apply.',
    example: 'Look at a paragraph that lists evidence without explaining what it supports. Discuss how the claim, evidence and analysis could work together.',
    outcome: 'A repeatable revision method and concrete feedback you can apply to a fresh paragraph.',
    boundary: 'Coaching develops your writing. You make the revisions and remain the author.'
  },
  'data-analysis-and-statistical-support': {
    bring: 'Bring your question, a description of your variables and, where appropriate, anonymised example data or output.',
    example: 'Review whether a proposed comparison matches your variable types. Discuss what a chart or statistical output supports and what it leaves uncertain.',
    outcome: 'A reasoned choice of method and a way to explain the result, assumptions and limitations in your own words.',
    boundary: 'Share only data you are permitted to use. We guide interpretation and checks rather than inventing results.'
  },
  'it-project-mentoring-and-code-review': {
    bring: 'Bring a small code sample you own or can share, what it should do, and a description of what you already tried.',
    example: 'Trace a request through a sample application, then discuss how to test the behaviour and make the code easier to maintain.',
    outcome: 'Prioritised feedback and a manageable improvement you can implement and explain yourself.',
    boundary: 'Remove credentials and private data before sharing. Mentoring supports your own implementation.'
  },
  'legal-research-support': {
    bring: 'Share the academic question, relevant jurisdiction and any sources or citation guidance your course specifies.',
    example: 'Trace a proposition from commentary to the underlying case or statute. Discuss how authority and later treatment affect its usefulness.',
    outcome: 'A clearer research trail and a method for checking authority, relevance and citations.',
    boundary: 'This is academic support. It does not constitute legal advice or representation.'
  },
  'educational-content-and-blogging-services': {
    bring: 'Share your audience, purpose, desired format and any examples or house style the material should follow.',
    example: 'Review an outline for a short learning article. Decide what the reader needs first, where an example would clarify the point and which claims need sources.',
    outcome: 'A clearer structure and agreed editorial priorities, such as readability, examples or source checks.',
    boundary: 'Discuss ownership and the scope of any writing or editorial work before sharing unpublished material.'
  }
}

export const serviceDetails: Record<string, [string, string][]> = {
  'academic-tutoring': [
    ['When a method only makes sense in class', 'Bring an example you can follow with notes but struggle to repeat on your own. We can isolate the first step you cannot explain, work through a comparable problem and then change one condition to check your understanding.'],
    ['Plan independent practice', 'Use the mistakes from your attempt to choose which concept to revisit. For exam preparation, bring a syllabus topic and a practice question so the discussion can focus on the reasoning and working an examiner can see.']
  ],
  'assignment-guidance-and-academic-support': [
    ['Turn the brief into a plan', 'For a question that asks you to evaluate two approaches, identify the criteria for comparison first. Make an outline that allocates space to evidence, counterarguments and your own judgement.'],
    ['Check your draft against the criteria', 'Pick a paragraph and mark the claim, the evidence and the explanation. If the evidence is present but its link to the question is unclear, use the feedback to revise that reasoning yourself.']
  ],
  'proofreading-and-editing': [
    ['Choose the level of feedback', 'Share a short sample and say whether the main concern is surface errors, readability or consistency. A sample makes it easier to agree how feedback will be presented before reviewing a longer draft.'],
    ['Apply the feedback across a document', 'Look for repeated issues such as changing tense, unexplained abbreviations or mixed heading styles. Use the marked examples to check the remaining sections and preserve the meaning of each claim.']
  ],
  'academic-research-support': [
    ['Test whether your question is answerable', 'Identify the population, context and outcome you want to study. List the evidence you can actually access, then narrow the question where the original scope would require unavailable records or extra time.'],
    ['Compare possible evidence sources', 'Consider what interviews, existing datasets or published studies could each tell you. Write down the limitations of the most practical option and which claims it would support.']
  ],
  'dissertation-and-thesis-guidance': [
    ['Map the argument across chapters', 'Give each chapter a clear role. Check that the background leads to the research question, the method can answer it and the discussion explains how the findings relate to earlier work.'],
    ['Decide which revision to make first', 'Bring a draft section and its purpose. Resolve gaps in argument, evidence or explanation before revising paragraph flow and wording.']
  ],
  'research-proposal-guidance': [
    ['Connect the aim to the method', 'Write the central question in one sentence and identify what evidence would answer it. For each objective, state what you would collect or review and how it would inform the question.'],
    ['Check feasibility before committing', 'Walk through access, recruitment, approvals and time. If one dependency is uncertain, identify a narrower design or a different evidence source to discuss with your supervisor.']
  ],
  'literature-review-support': [
    ['Build a search you can explain', 'Start with the main concepts in your question, collect common synonyms and test them in a relevant database. Record the search terms, date and inclusion rules so you can explain how you selected sources.'],
    ['Write across studies', 'Compare two papers with different findings by looking at their settings, participants and measures. Group the evidence around the reason for the disagreement so your writing develops a synthesis.']
  ],
  'referencing-and-citation-assistance': [
    ['Trace a citation from text to source', 'Bring a sample paragraph and its bibliography. Check which claim each reference supports and whether the author, year and page details let the reader find the original passage.'],
    ['Review a reference manager export', 'Check imported records for missing authors, titles, dates or publication details. Compare a few examples against your required style before applying the same checks across the list.']
  ],
  'academic-writing-coaching': [
    ['Explain what your evidence shows', 'Underline the main claim in a paragraph. After each source or example, add your reasoning about what it shows and how it answers the question.'],
    ['Revise in separate passes', 'Start with the overall argument, then check the order and purpose of paragraphs, and finish with sentence clarity. Bring a short extract to practise this process on your own writing.']
  ],
  'data-analysis-and-statistical-support': [
    ['Choose a method from the question', 'Describe what each row represents, the types of variables and whether observations are paired or independent. Use those details to discuss suitable summaries or analyses and which assumptions to check.'],
    ['Interpret an output table', 'Identify the estimate, direction and uncertainty, and explain what they mean in the context of the data. Bring an anonymised example or a synthetic dataset to work through the interpretation.']
  ],
  'it-project-mentoring-and-code-review': [
    ['Narrow down a development problem', 'Bring a small code excerpt, the expected behaviour and what currently happens. Trace the data through the relevant component or function and identify the first point where it differs from what you expect.'],
    ['Make a focused improvement', 'Choose one change that makes the code easier to understand or test. For example, separate form validation from presentation and practise checking valid, invalid and empty inputs.']
  ],
  'legal-research-support': [
    ['Find the authority behind a proposition', 'Start from the issue and jurisdiction, then identify the case or legislation that bears on the point. Read the relevant passage in context and record a citation that takes the reader to it.'],
    ['Build an academic case comparison', 'Set out the material facts, legal issue and reasoning for each case. Then explain which factual difference matters to your argument and where commentary helps interpret the authority.']
  ],
  'educational-content-and-blogging-services': [
    ['Define the learning goal', 'For a guide aimed at beginners, specify what readers should be able to explain or do after reading. Outline the explanation and choose an example that demonstrates that skill.'],
    ['Review a draft for readers and sources', 'Check that headings describe the reader’s questions, examples follow in a useful order and factual claims can be traced. Use the review to agree concrete editorial revisions.']
  ]
}
