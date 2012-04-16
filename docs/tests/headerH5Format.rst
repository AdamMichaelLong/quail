===============================
All h5 elements are not used for formatting
===============================

*Severity code:* Information only

.. php:class:: headerH5Format


An <code>h5 element may not be used purely for formatting.




Users of screen readers often use headers to discover the structure of the document, and using headers for formatting can cause this method of navigating the document to be confusing. Try using CSS styles to apply formatting to the item instead.



Example
-------
Wrong
-----

.. code-block:: html

    &lt;h5&gt;I wanted a line to be bold and large but this is just a regular paragraph.&lt;/h5&gt;



Right
-----

.. code-block:: html

    &lt;p class="large-item"&gt;&lt;strong&gt;I wanted a line to be bold and large but this is just a regular paragraph.&lt;/strong&gt;&lt;/p&gt;




