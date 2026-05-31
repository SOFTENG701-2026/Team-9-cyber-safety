import { useMemo, useState } from 'react';

import emailQuestions from '../../resources/questions/email-questions.json';

type EmailQuestion = {
	subject: string;
	sender: string;
	recipient: string;
	body: string;
};

type EmailQuestionItem = EmailQuestion & {
	id: string;
};

const emails = Object.entries(emailQuestions as Record<string, EmailQuestion>)
	.sort(([leftId], [rightId]) => Number(leftId) - Number(rightId))
	.map(([id, email]) => ({
		id,
		...email,
	}));

const QuestionEmail = () => {
	
	const [selectedEmailId, setSelectedEmailId] = useState(emails[0]?.id ?? '');

	const selectedEmail = useMemo<EmailQuestionItem | undefined>(
		() => emails.find((email) => email.id === selectedEmailId),
		[selectedEmailId]
	);

	return(
		<div className="text-left">
			<div className="w-full max-w-5xl mx-auto h-64 rounded-xl p-6 text-slate-900 flex flex-col gap-4">{/*className="email-list" */}
			<div className="w-full max-w-5xl mx-auto p-6">
				<div className="flex w-full gap-6 ">
					<aside className="w-1/3 rounded-xl bg-[#E8F0E0] p-4">
						<h2 className="mb-3 text-lg font-semibold text-slate-800">Inbox</h2>
						<div className="flex flex-col gap-3">
							{emails.map((email) => (
								<button
									key={email.id}
									className="w-full text-left rounded-md bg-white/90 px-4 py-2 text-slate-900 hover:bg-white"
									onClick={() => setSelectedEmailId(email.id)}
								>
									<p className="text-sm font-medium">{email.sender}</p>
									<p className="text-xs text-slate-600">{email.subject}</p>
								</button>
							))}
						</div>
					</aside>

					<section className="flex-1 rounded-xl bg-white p-6">
						<div className="mb-4">
							{/* Subject as its own button */}
							<button type="button" className="w-full text-left p-0 active:bg-emerald-100 focus:bg-emerald-100 focus:outline-none">
								<h3 className="text-2xl font-bold text-slate-900">{selectedEmail?.subject}</h3>
							</button>

							<div className="mt-0 flex items-start gap-4">
								<div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-semibold text-lg">
									{selectedEmail?.sender ? selectedEmail.sender.trim().charAt(0).toUpperCase() : ''}
								</div>
								<div className="flex flex-col w-full">
									<button type="button" className="text-left rounded-md px-2 py-1 active:bg-emerald-100 focus:bg-emerald-100 focus:outline-none">
										From: {selectedEmail?.sender}
									</button>
									<button type="button" className="text-left rounded-md px-2 py-1 active:bg-emerald-100 focus:bg-emerald-100 focus:outline-none">
										To: {selectedEmail?.recipient}
									</button>
								</div>
							</div>
						</div>

						{/* Body as its own button */}
						<button type="button" className="w-full text-left whitespace-pre-line rounded-lg bg-white p-4 text-slate-800 active:bg-emerald-100 focus:bg-emerald-100 focus:outline-none">
							{selectedEmail?.body}
						</button>
					</section>
				</div>
			</div>
		</div>
		</div>
	);
};

export default QuestionEmail
