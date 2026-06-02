import { useMemo, useState, useEffect, useRef } from 'react';
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
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	
	// Music state
	const [musicPlaying, setMusicPlaying] = useState(false);
	const [isManuallyMuted, setIsManuallyMuted] = useState(false);
	const [debugInfo, setDebugInfo] = useState<string>("🎵 Click Play Music");
	const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

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

	// Get sender initial for avatar
	const getSenderInitial = (sender: string) => {
		return sender ? sender.trim().charAt(0).toUpperCase() : '?';
	};

	// Get sender color based on name
	const getSenderColor = (sender: string) => {
		const colors = ['#0F6E56', '#EF9F27', '#C0563A', '#5B8E3E', '#E67AA5', '#D69C1E'];
		const index = sender.length % colors.length;
		return colors[index];
	};

	// Initialize audio
	useEffect(() => {
		if (!backgroundMusicRef.current && !embedded) {
			backgroundMusicRef.current = new Audio('/sounds/game-music.mp3');
			backgroundMusicRef.current.loop = true;
			backgroundMusicRef.current.volume = 0.3;
			
			backgroundMusicRef.current.addEventListener('canplaythrough', () => {
				setDebugInfo("🎵 Music ready! Click Play Music");
			});
			
			backgroundMusicRef.current.addEventListener('error', () => {
				setDebugInfo("⚠️ Music file not found");
			});
		}
		
		return () => {
			if (backgroundMusicRef.current) {
				backgroundMusicRef.current.pause();
			}
		};
	}, [embedded]);

	const playMusic = () => {
		if (!backgroundMusicRef.current) {
			backgroundMusicRef.current = new Audio('/sounds/game-music.mp3');
			backgroundMusicRef.current.loop = true;
			backgroundMusicRef.current.volume = 0.3;
		}
		
		backgroundMusicRef.current.play()
			.then(() => {
				setDebugInfo("🎵 Music playing!");
				setMusicPlaying(true);
				setIsManuallyMuted(false);
			})
			.catch(() => {
				setDebugInfo("⚠️ Click anywhere first, then play music");
			});
	};

	const stopMusic = () => {
		if (backgroundMusicRef.current && musicPlaying) {
			backgroundMusicRef.current.pause();
			setMusicPlaying(false);
		}
	};

	const toggleMute = () => {
		if (backgroundMusicRef.current) {
			if (musicPlaying) {
				backgroundMusicRef.current.pause();
				setMusicPlaying(false);
				setIsManuallyMuted(true);
				setDebugInfo("🔇 Music muted");
			} else if (isManuallyMuted) {
				backgroundMusicRef.current.play()
					.then(() => {
						setMusicPlaying(true);
						setIsManuallyMuted(false);
						setDebugInfo("🔊 Music playing");
					})
					.catch(() => setDebugInfo("⚠️ Click play button to start"));
			} else if (!allSolved) {
				backgroundMusicRef.current.play()
					.then(() => {
						setMusicPlaying(true);
						setDebugInfo("🔊 Music playing");
					})
					.catch(() => setDebugInfo("⚠️ Click play button to start"));
			}
		}
	};

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

	const handleComplete = () => {
		stopMusic();
		if (onComplete) onComplete();
	};

	return (
		<div className="relative min-h-screen">
			{/* Background */}
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

			{/* Music Status Display */}
			<div className="fixed bottom-4 left-4 z-50 bg-black/60 text-white text-xs rounded-full px-3 py-1.5 font-mono backdrop-blur-sm">
				{debugInfo}
			</div>

			{/* Music Control Buttons */}
			<div className="fixed top-4 right-4 z-30 flex gap-2">
				{!musicPlaying && !isManuallyMuted && (
					<button
						onClick={playMusic}
						className="bg-[#3B6D11] text-white rounded-full px-4 py-2 shadow-md hover:scale-105 transition-all text-sm font-semibold animate-pulse"
					>
						🎵 Play Music
					</button>
				)}
				<button
					onClick={toggleMute}
					className="bg-white/90 rounded-full p-3 shadow-md hover:scale-105 transition-all text-xl"
					title={musicPlaying ? "Mute Music" : "Play Music"}
				>
					{musicPlaying ? '🔊' : '🔇'}
				</button>
			</div>

			<div className={`relative z-10 w-full mx-auto p-4 md:p-6 ${embedded ? 'max-w-none' : 'max-w-6xl'}`}>
				{/* Header */}
				<div className="text-center mb-6">
					<div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-5 py-1.5 shadow-sm mb-2">
						<span className="text-lg">✉️</span>
						<span className="text-lg font-semibold text-[#3B6D11]">Email Detective</span>
					</div>
					<h1 className="text-[#3B6D11] text-3xl md:text-4xl font-['Holtwood_One_SC'] mb-2">Spot the Phishy Parts</h1>
					<p className="text-gray-600 text-sm max-w-2xl mx-auto">Review each email and report anything suspicious.</p>
				</div>

				<div className="flex w-full flex-col gap-5 lg:flex-row">
					
					{/* Email Inbox Sidebar */}
					<aside className={`rounded-2xl bg-white/90 shadow-lg border border-gray-200 overflow-hidden transition-all ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'} lg:flex-shrink-0`}>
						<div className="bg-gradient-to-r from-[#0F6E56] to-[#1a8a6a] px-4 py-3 flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-white text-lg">📬</span>
								{!sidebarCollapsed && <h2 className="text-white font-semibold">Inbox</h2>}
							</div>
							<button
								onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								className="text-white/80 hover:text-white transition-colors"
							>
								{sidebarCollapsed ? '→' : '←'}
							</button>
						</div>
						
						<div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
							{emails.map((email) => {
								const isEmailSolved = correctEmailIds.includes(email.id);
								const isSelectedEmail = email.id === selectedEmailId;
								const senderColor = getSenderColor(email.sender);
								const senderInitial = getSenderInitial(email.sender);

								return (
									<button
										key={email.id}
										type="button"
										onClick={() => handleSelectEmail(email.id)}
										className={`w-full text-left transition-all hover:bg-gray-50 ${
											isSelectedEmail ? 'bg-[#E8F0E0] border-l-4 border-l-[#0F6E56]' : ''
										}`}
									>
										<div className="px-4 py-3 flex items-start gap-3">
											<div 
												className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
												style={{ backgroundColor: senderColor }}
											>
												{senderInitial}
											</div>
											
											{!sidebarCollapsed && (
												<div className="flex-1 min-w-0">
													<div className="flex items-center justify-between gap-2">
														<p className="text-sm font-medium text-gray-900 truncate">{email.sender}</p>
														{isEmailSolved && (
															<span className="inline-flex items-center gap-1 text-[#0F6E56] text-xs font-semibold">
																✓
															</span>
														)}
													</div>
													<p className="text-xs text-gray-500 truncate">{email.subject}</p>
												</div>
											)}
											
											{sidebarCollapsed && isEmailSolved && (
												<span className="text-[#0F6E56] text-xs">✓</span>
											)}
										</div>
									</button>
								);
							})}
						</div>
						
						<div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
							{!sidebarCollapsed ? (
								<p className="text-xs text-gray-500 text-center">
									{correctEmailIds.length} of {emails.length} emails solved
								</p>
							) : (
								<div className="text-center">
									<span className="text-xs font-medium text-[#0F6E56]">{correctEmailIds.length}/{emails.length}</span>
								</div>
							)}
						</div>
					</aside>

					{/* Email Content Area */}
					<section className={`flex-1 rounded-2xl shadow-lg border overflow-hidden transition-colors ${isCurrentEmailCorrect ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
						{/* Email Header */}
						<div className={`border-b px-6 py-4 ${isCurrentEmailCorrect ? 'border-green-200 bg-green-100/50' : 'border-gray-200 bg-gray-50'}`}>
							<h2 className="text-xl font-semibold text-gray-800">{selectedEmail?.subject}</h2>
						</div>

						{/* Email Content */}
						<div className="p-6">
							{/* Email Metadata */}
							<div className="mb-6 pb-4 border-b border-gray-200">
								<div className="flex items-start gap-4">
									<div 
										className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
										style={{ backgroundColor: getSenderColor(selectedEmail?.sender || '') }}
									>
										{getSenderInitial(selectedEmail?.sender || '')}
									</div>
									<div className="flex-1">
										<div className="flex items-baseline gap-2 flex-wrap">
											<span className="font-semibold text-gray-900">{selectedEmail?.sender}</span>
											<span className="text-gray-500 text-sm">&lt;{selectedEmail?.sender?.toLowerCase().replace(/\s/g, '')}&gt;</span>
										</div>
										<div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
											<span>To: {selectedEmail?.recipient}</span>
										</div>
										<div className="mt-1 text-xs text-gray-400">
											Received: Just now
										</div>
									</div>
								</div>
							</div>

							{/* Email Body */}
							<div className="prose prose-sm max-w-none mb-6">
								<div className="whitespace-pre-line text-gray-700 leading-relaxed">
									{selectedEmail?.body}
								</div>
							</div>

							{/* Report Section */}
							{!isCurrentEmailCorrect && (
								<div className="mt-4 pt-4 border-t border-gray-200">
									<button
										type="button"
										onClick={() => setReportOpen((current) => !current)}
										className="inline-flex items-center gap-2 rounded-full bg-[#EF9F27] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D48A1A] transition-all"
									>
										<span>⚠️</span> Report
									</button>
								</div>
							)}

							{/* Correct message - shown when email is solved */}
							{isCurrentEmailCorrect && (
								<div className="mt-4 pt-4 border-t border-green-200">
									<p className="text-green-700 font-semibold text-sm flex items-center gap-2">
										<span>✓</span> Correct!
									</p>
								</div>
							)}

							{/* Report Options */}
							{reportOpen && !isCurrentEmailCorrect && (
								<div className="mt-4 rounded-xl bg-white border-2 border-[#EF9F27] shadow-lg p-4">
									<div className="flex items-start justify-between mb-3">
										<p className="text-sm font-semibold text-gray-900">What's suspicious?</p>
										<button
											onClick={() => setReportOpen(false)}
											className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
										>
											✕ Close
										</button>
									</div>
									
									<div className="flex flex-wrap gap-3">
										{reportOptions.length > 0 ? (
											reportOptions.map((option) => {
												const isSelected = selectedReportOptions.includes(option.question);
												const isMatch = isSelected === option.correct;
												
												let optionClasses = "cursor-pointer transition-all rounded-lg px-4 py-2 text-sm font-medium ";
												
												if (reportSubmitted) {
													if (isMatch) {
														optionClasses += "bg-green-100 border-2 border-green-500 text-green-800";
													} else {
														optionClasses += "bg-red-100 border-2 border-red-500 text-red-800";
													}
												} else {
													if (isSelected) {
														optionClasses += "bg-[#0F6E56] text-white shadow-md";
													} else {
														optionClasses += "bg-gray-100 border-2 border-gray-200 text-gray-700 hover:bg-gray-200";
													}
												}
												
												return (
													<label
														key={option.question}
														className="flex items-center gap-2 cursor-pointer"
													>
														<input
															type="checkbox"
															checked={isSelected}
															onChange={() => toggleReportOption(option.question)}
															disabled={reportLocked}
															className="sr-only"
														/>
														<div className={optionClasses}>
															<div className="flex items-center gap-2">
																{reportSubmitted && (
																	<span className="text-base">
																		{isMatch ? '✅' : '❌'}
																	</span>
																)}
																<span>{option.question}</span>
															</div>
															{reportSubmitted && !isMatch && (
																<p className="mt-1 text-xs text-gray-600 max-w-xs">{option.reason}</p>
															)}
														</div>
													</label>
												);
											})
										) : (
											<p className="text-sm text-gray-500">No report options available.</p>
										)}
									</div>
									
									<div className="mt-4 flex justify-end gap-3 pt-3 border-t border-gray-100">
										{!reportSubmitted && (
											<button
												type="button"
												disabled={isCurrentEmailCorrect}
												onClick={handleReportButtonClick}
												className="rounded-full bg-[#0F6E56] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a5a45] transition-all disabled:opacity-50"
											>
												Submit Report
											</button>
										)}
										{reportSubmitted && hasIncorrectSelections && (
											<button
												type="button"
												onClick={handleTryAgainClick}
												className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-all"
											>
												Try Again
											</button>
										)}
										{reportSubmitted && isAllCorrect && (
											<p className="text-sm font-semibold text-green-700 flex items-center gap-1">
												✅ Correct! Great detective work!
											</p>
										)}
									</div>
								</div>
							)}
						</div>
					</section>
				</div>

				{/* Continue Button */}
				{allSolved && (
					<div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
						<button
							onClick={handleComplete}
							className="bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 transition-all rounded-full px-10 py-4 text-white font-bold text-xl shadow-2xl animate-pulse"
						>
							Continue Story
						</button>
					</div>
				)}
			</div>

			<style>{`
				@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-5px); } }
				@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
				.animate-float { animation: float 3s ease-in-out infinite; }
				.animate-pulse { animation: pulse 2s ease-in-out infinite; }
			`}</style>
		</div>
	);
};

export default QuestionEmail;