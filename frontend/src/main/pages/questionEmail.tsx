import { useMemo, useState } from 'react';

import emailQuestions from '../../resources/questions/email-questions.json';

type ReportOption = {
	question: string;
	correct: boolean;
	reason: string;
};

type EmailQuestionMeta = {
	options: ReportOption[];
};

type EmailQuestion = {
	subject: string;
	sender: string;
	recipient: string;
	body: string;
	question?: EmailQuestionMeta;
};

type EmailQuestionItem = EmailQuestion & {
	id: string;
};

type QuestionEmailProps = {
	embedded?: boolean;
	onComplete?: () => void;
};

const emails = Object.entries(emailQuestions as Record<string, EmailQuestion>)
	.sort(([leftId], [rightId]) => Number(leftId) - Number(rightId))
	.map(([id, email]) => ({
		id,
		...email,
	}));

const QuestionEmail = ({ embedded = false, onComplete }: QuestionEmailProps) => {
	const [selectedEmailId, setSelectedEmailId] = useState(emails[0]?.id ?? '');
	const [reportOpen, setReportOpen] = useState(false);
	const [selectedReportOptions, setSelectedReportOptions] = useState<string[]>([]);
	const [reportSubmitted, setReportSubmitted] = useState(false);
	const [reportLocked, setReportLocked] = useState(false);
	const [correctEmailIds, setCorrectEmailIds] = useState<string[]>([]);

	const selectedEmail = useMemo<EmailQuestionItem | undefined>(
		() => emails.find((email) => email.id === selectedEmailId),
		[selectedEmailId]
	);

	const reportOptions = selectedEmail?.question?.options ?? [];
	const hasIncorrectSelections = reportOptions.some(
		(option) => selectedReportOptions.includes(option.question) !== option.correct
	);
	const isAllCorrect =
		reportOptions.length > 0 &&
		reportOptions.every((option) => selectedReportOptions.includes(option.question) === option.correct);
	const isCurrentEmailCorrect = correctEmailIds.includes(selectedEmailId);

	const allSolved = correctEmailIds.length === emails.length && emails.length > 0;

	const handleSelectEmail = (emailId: string) => {
		setSelectedEmailId(emailId);
		setReportOpen(false);
		setSelectedReportOptions([]);
		setReportSubmitted(false);
		setReportLocked(false);
	};

	const toggleReportOption = (optionQuestion: string) => {
		if (reportLocked) return;
		setSelectedReportOptions((current) =>
			current.includes(optionQuestion)
				? current.filter((question) => question !== optionQuestion)
				: [...current, optionQuestion]
		);
	};

	const handleReportButtonClick = () => {
		setReportLocked(true);
		if (isAllCorrect) {
			setCorrectEmailIds((current) =>
				current.includes(selectedEmailId) ? current : [...current, selectedEmailId]
			);
			setSelectedReportOptions([]);
			setReportSubmitted(false);
			setReportOpen(false);
			return;
		}

		setReportSubmitted(true);
	};

	const handleTryAgainClick = () => {
		setSelectedReportOptions([]);
		setReportSubmitted(false);
		setReportOpen(true);
		setReportLocked(false);
	};

	return (
		<div className="relative min-h-screen">
			<div className="fixed inset-0 z-0">
				<div className="absolute inset-0 bg-gradient-to-br from-[#E8F0E0] via-[#F7F5EE] to-[#FFF4E6]"></div>
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233B6D11' fill-opacity='0.3'%3E%3Cpath d='M20 20 L25 15 L30 20 L25 25 Z M10 10 L15 5 L20 10 L15 15 Z M30 30 L35 25 L40 30 L35 35 Z'/%3E%3C/g%3E%3C/svg%3E")`,
						backgroundRepeat: 'repeat',
					}}
				/>
			</div>

			<div className={`relative z-10 w-full mx-auto p-6 ${embedded ? 'max-w-none' : 'max-w-5xl'}`}>
				<div className="text-center mb-6">
					<div className="inline-block bg-white/80 rounded-full px-5 py-1.5 shadow-sm mb-2">
						<span className="text-lg font-semibold text-[#3B6D11]">✉️ Email Detective</span>
					</div>
					<h1 className="text-[#3B6D11] text-3xl font-['Holtwood_One_SC'] mb-1">Spot the Phishy Parts</h1>
					<p className="text-gray-600 text-sm max-w-2xl mx-auto">Review each email and report suspicious parts.</p>
				</div>

				<div className="flex w-full flex-col gap-6 lg:flex-row">
					<aside className="w-full rounded-2xl bg-white/90 shadow-lg border-2 p-4 lg:w-1/3">
						<h2 className="mb-3 text-lg font-semibold text-slate-800">Inbox</h2>
						<div className="flex flex-col gap-3">
							{emails.map((email) => {
								const isEmailSolved = correctEmailIds.includes(email.id);
								const isSelectedEmail = email.id === selectedEmailId;

								return (
									<button
										key={email.id}
										type="button"
										className={`w-full rounded-xl border-2 px-4 py-3 text-left text-slate-900 transition-colors shadow ${isSelectedEmail ? (isEmailSolved ? 'border-gray-400 bg-green-100 text-green-950 hover:bg-green-100' : 'border-gray-400 bg-white/95 hover:bg-white') : isEmailSolved ? 'border-green-300 bg-green-100 text-green-950 hover:bg-green-100' : 'border-white bg-white hover:bg-white'}`}
										onClick={() => handleSelectEmail(email.id)}
									>
										<div className="flex items-center justify-between gap-3">
											<p className="text-sm font-medium">{email.sender}</p>
											<span className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border text-sm font-bold ${isEmailSolved ? 'border-green-600 bg-green-500 text-white' : 'border-transparent bg-transparent text-transparent'}`}>
												{isEmailSolved ? '✓' : '✓'}
											</span>
										</div>
										<p className="text-xs text-slate-600">{email.subject}</p>
									</button>
								);
								})}
							{allSolved && (
								<div className="mt-4 flex justify-center">
									<button
										type="button"
										onClick={onComplete}
										className="bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 transition-all rounded-full px-6 py-2 text-white font-bold shadow-md"
									>
										Continue
									</button>
								</div>
							)}
						</div>
					</aside>

					<section
						className={`relative flex-1 rounded-2xl border-2 p-6 shadow-lg ${isCurrentEmailCorrect ? 'border-green-200 bg-green-100' : 'border-white bg-white'}`}
					>
						<div className="absolute right-4 top-4 z-20">
							<button
								type="button"
								disabled={isCurrentEmailCorrect}
								onClick={() => setReportOpen((current) => !current)}
								className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
							>
								Report
							</button>

							{reportOpen && (
								<div
									className={`mt-2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg ${embedded ? 'absolute right-0 top-full w-[min(90vw,22rem)]' : 'absolute left-full top-0 ml-2 w-80'}`}
								>
									<p className="mb-3 text-sm font-semibold text-slate-900">Report options</p>
									<div className="flex flex-col gap-3">
										{reportOptions.length > 0 ? (
											reportOptions.map((option) => {
												const isSelected = selectedReportOptions.includes(option.question);
												const isMatch = isSelected === option.correct;
												const optionClassName = reportSubmitted
													? isMatch
														? 'border-green-300 bg-green-50'
														: 'border-red-300 bg-red-50'
													: 'border-transparent hover:bg-slate-50';

												return (
													<label
														key={option.question}
														className={`flex cursor-pointer items-start gap-3 rounded-md border px-2 py-2 text-sm text-slate-800 ${optionClassName}`}
													>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => toggleReportOption(option.question)}
															disabled={reportLocked}
															className="sr-only"
														/>
														<span
																	className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border text-sm font-bold ${reportSubmitted ? isMatch ? 'border-green-600 bg-green-500 text-white' : 'border-red-600 bg-red-500 text-white' : isSelected ? 'border-slate-400 bg-white text-slate-900' : 'border-slate-300 bg-white text-transparent'}`}
															aria-hidden="true"
														>
																{reportSubmitted ? (isMatch ? '✓' : '✕') : isSelected ? '✓' : ''}
														</span>
														<div className="flex-1">
															<span>{option.question}</span>
															{reportSubmitted && !isMatch && (
																<p className="mt-1 text-xs text-slate-700">{option.reason}</p>
															)}
														</div>
													</label>
												);
											})
										) : (
											<p className="text-sm text-slate-500">No report options available for this email.</p>
										)}
									</div>
									<div className="mt-4 flex justify-end border-t border-slate-200 pt-3">
										{!reportSubmitted && (
											<button
												type="button"
												disabled={isCurrentEmailCorrect}
												onClick={handleReportButtonClick}
												className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
											>
												Submit
											</button>
										)}
										{reportSubmitted && hasIncorrectSelections && (
											<button
												type="button"
												onClick={handleTryAgainClick}
												className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400"
											>
												Try Again
											</button>
										)}
										{reportSubmitted && isAllCorrect && (
											<p className="text-sm font-semibold text-green-700">All options correct.</p>
										)}
									</div>
								</div>
							)}
						</div>
							<div className="mb-4 text-left">
								<p className="mb-3 text-2xl font-medium text-slate-800">{selectedEmail?.subject}</p>
								<div className="mt-0 flex items-start gap-4">
									<div className="inline-flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white animate-float">
										{selectedEmail?.sender ? selectedEmail.sender.trim().charAt(0).toUpperCase() : ''}
									</div>
									<div className="flex w-full flex-col">
										<p className="rounded-md px-2 py-1 text-left text-slate-800">From: {selectedEmail?.sender}</p>
										<p className="rounded-md px-2 py-1 text-left text-slate-800">To: {selectedEmail?.recipient}</p>
									</div>
								</div>
							</div>

							<div className={`w-full whitespace-pre-line rounded-lg p-4 text-left text-slate-800'}`}>
								{selectedEmail?.body}
							</div>
					</section>
				</div>
			</div>
			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
				.animate-float { animation: float 3s ease-in-out infinite; }
			`}</style>
		</div>
	);
};

export default QuestionEmail