
export default function UsersLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="container mx-auto max-w-[100%] flex-grow">
			<div className="max-w-[100%] max-h-[100%]">
				{children}
			</div>
		</section>
	);
}
